import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { CACHE } from '@/lib/cache-headers'
import { analysisRepository } from '@/repositories/analysis.repository'

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const stats = await analysisRepository.getUserStats(userId)

    return NextResponse.json(
      { stats },
      { status: 200, headers: CACHE.privateShort }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
