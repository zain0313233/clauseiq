import { NextRequest, NextResponse } from 'next/server'
import { requirePortalAccess } from '@/lib/auth-session'
import { userRepository } from '@/repositories/user.repository'
import { CACHE } from '@/lib/cache-headers'
import { dashboardRepository } from '@/repositories/dashboard.repository'

export async function GET(req: NextRequest) {
  try {
    const user = await requirePortalAccess(req)
    const userId = user.id

    const [weeklyActivity, typeDistribution] = await Promise.all([
      dashboardRepository.getWeeklyActivity(userId),
      dashboardRepository.getTypeDistribution(userId),
    ])

    return NextResponse.json(
      { weeklyActivity, typeDistribution },
      { status: 200, headers: CACHE.privateShort }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
