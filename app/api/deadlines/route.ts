import { NextRequest, NextResponse } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import { parseLimit, parsePage } from '@/lib/pagination'
import { userRepository } from '@/repositories/user.repository'
import { analysisRepository } from '@/repositories/analysis.repository'

export async function GET(req: NextRequest) {
  try {
    const user = await requireEmailVerified(req)
    const userId = user.id

    const { searchParams } = req.nextUrl
    const page = parsePage(searchParams.get('page'))
    const limit = parseLimit(searchParams.get('limit'), 5, 20)

    const result = await analysisRepository.getUpcomingDeadlinesPaginated(
      userId,
      page,
      limit
    )

    const { deadlines, ...pagination } = result

    return NextResponse.json({ deadlines, pagination }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
