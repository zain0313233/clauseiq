import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { dashboardRepository } from '@/repositories/dashboard.repository'

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [weeklyActivity, typeDistribution] = await Promise.all([
      dashboardRepository.getWeeklyActivity(userId),
      dashboardRepository.getTypeDistribution(userId),
    ])

    return NextResponse.json({ weeklyActivity, typeDistribution }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
