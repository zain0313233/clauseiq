import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { documentRepository } from '@/repositories/document.repository'
import { hasPermission } from '@/lib/rbac'
import { aiService } from '@/services/ai.service'

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'query:ask')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { question } = body

    if (!question?.trim()) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }

    const documents = await documentRepository.findReadyByUserId(userId)
    const documentIds = documents.map((d) => d.id)
    const documentTitles = Object.fromEntries(
      documents.map((d) => [d.id, d.title])
    )

    const result = await aiService.queryPortfolio({
      question: question.trim(),
      user_id: userId,
      document_ids: documentIds,
      document_titles: documentTitles,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Portfolio query failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
