import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
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
    const { document_id, question } = body

    if (!document_id) return NextResponse.json({ error: 'document_id is required' }, { status: 400 })
    if (!question) return NextResponse.json({ error: 'question is required' }, { status: 400 })

    const result = await aiService.queryDocument({
      document_id,
      question,
      user_id: userId,
    })

    return NextResponse.json(result, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}