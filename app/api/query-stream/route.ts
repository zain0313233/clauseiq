import { NextRequest } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import { documentRepository } from '@/repositories/document.repository'
import { hasPermission } from '@/lib/rbac'
import { assertValidQueryQuestion } from '@/lib/query-validation'
import { conversationRepository } from '@/repositories/conversation.repository'
import { messageRepository } from '@/repositories/message.repository'
import { sanitizeSourcesForStorage } from '@/lib/message-metadata'
import { buildConversationHistory } from '@/lib/conversation-history'
import { getEngineApiSecret } from '@/lib/engine-secret'
import { randomUUID } from 'crypto'
import type { QueryConfidence, QuerySource } from '@/lib/clausemind'
import { SSE_HEADERS } from '@/lib/sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

function parseEngineSseChunk(
  chunk: string,
  state: {
    answerParts: string
    sources: QuerySource[]
    confidence: QueryConfidence
  }
) {
  const parts = chunk.split('\n\n')
  for (const part of parts) {
    if (!part.trim()) continue
    const dataLine = part.split('\n').find((l) => l.startsWith('data:'))
    if (!dataLine) continue

    try {
      const payload = JSON.parse(dataLine.slice(5).trim()) as {
        type: string
        text?: string
        sources?: Array<{
          content: string
          chunk_index: number
          score: number
        }>
        confidence?: QueryConfidence
      }

      if (payload.type === 'token' && payload.text) {
        state.answerParts += payload.text
      } else if (payload.type === 'sources' && payload.sources) {
        state.sources = payload.sources.map((s) => ({
          content: s.content,
          chunkIndex: s.chunk_index,
          score: s.score,
        }))
      } else if (payload.type === 'done') {
        state.confidence = payload.confidence ?? 'medium'
      }
    } catch {
      // ignore malformed chunks while pass-through continues
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmailVerified(req)
    const userId = user.id

    if (!hasPermission(user.role, 'query:ask')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const body = await req.json()
    const { document_id, question, mode } = body

    if (!document_id) {
      return new Response(JSON.stringify({ error: 'document_id is required' }), {
        status: 400,
      })
    }

    let normalizedQuestion: string
    try {
      normalizedQuestion = assertValidQueryQuestion(question ?? '')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'question is required'
      return new Response(JSON.stringify({ error: message }), { status: 400 })
    }

    const document = await documentRepository.findById(document_id)
    if (!document || document.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 })
    }

    const queryMode =
      mode === 'plain_english'
        ? 'plain_english'
        : mode === 'default'
          ? 'default'
          : 'conversational'

    const existing = await conversationRepository.findByUserAndDocument(
      userId,
      document_id
    )
    const history = buildConversationHistory(existing?.messages ?? [])

    const engineRes = await fetch(`${AI_ENGINE_URL}/query/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getEngineApiSecret()}`,
        'x-request-id': randomUUID(),
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        document_id,
        question: normalizedQuestion,
        user_id: userId,
        mode: queryMode,
        history,
      }),
    })

    if (!engineRes.ok || !engineRes.body) {
      return new Response(JSON.stringify({ error: 'Query failed' }), { status: 502 })
    }

    const conversation = await conversationRepository.getOrCreate(userId, document_id)
    const reader = engineRes.body.getReader()
    const decoder = new TextDecoder()
    const persistState = {
      answerParts: '',
      sources: [] as QuerySource[],
      confidence: 'medium' as QueryConfidence,
    }
    let parseBuffer = ''

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read()

        if (done) {
          if (persistState.answerParts.trim()) {
            await messageRepository.createPair({
              conversationId: conversation.id,
              userContent: normalizedQuestion,
              assistantContent: persistState.answerParts.trim(),
              assistantMetadata: {
                sources: sanitizeSourcesForStorage(persistState.sources),
                confidence: persistState.confidence,
              },
            })
          }
          controller.close()
          return
        }

        controller.enqueue(value)

        parseBuffer += decoder.decode(value, { stream: true })
        const segments = parseBuffer.split('\n\n')
        parseBuffer = segments.pop() ?? ''
        for (const segment of segments) {
          parseEngineSseChunk(`${segment}\n\n`, persistState)
        }
      },
    })

    return new Response(stream, {
      headers: {
        ...SSE_HEADERS,
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Query failed'
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Email not verified'
          ? 403
          : message === 'Forbidden'
            ? 403
            : 400
    return new Response(JSON.stringify({ error: message }), { status })
  }
}
