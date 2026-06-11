import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { queryService } from '@/services/query.service'

export async function POST(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'query:ask')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { document_id, question, mode } = body

    if (!document_id) return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    if (!question?.trim()) return NextResponse.json({ error: 'question is required' }, { status: 400 })

    const queryMode = mode === 'plain_english' ? 'plain_english' : 'default'
    const result = await queryService.ask(userId, document_id, question.trim(), queryMode)

    return NextResponse.json(result, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Query failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}