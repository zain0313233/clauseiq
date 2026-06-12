import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { assertValidQueryQuestion } from '@/lib/query-validation'
import { queryService } from '@/services/query.service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    const userId = user.id
    if (!hasPermission(user.role, 'query:ask')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { document_id, question, mode } = body

    if (!document_id) return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    let normalizedQuestion: string
    try {
      normalizedQuestion = assertValidQueryQuestion(question ?? '')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'question is required'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const document = await documentRepository.findById(document_id)
    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const queryMode = mode === 'plain_english' ? 'plain_english' : 'default'
    const result = await queryService.ask(userId, document_id, normalizedQuestion, queryMode)

    return NextResponse.json(result, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Query failed'
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: message }, { status: 401 })
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ error: message }, { status: 403 })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }
}