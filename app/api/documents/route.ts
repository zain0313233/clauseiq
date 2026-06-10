import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const documents = await documentRepository.findByUserId(userId)
    return NextResponse.json({ documents }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}