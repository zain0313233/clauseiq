import { NextRequest, NextResponse } from 'next/server'
import { requirePortalAccess } from '@/lib/auth-session'
import { CACHE } from '@/lib/cache-headers'
import { notificationService } from '@/services/notification.service'

export async function GET(req: NextRequest) {
  try {
    const user = await requirePortalAccess(req)
    const { searchParams } = req.nextUrl
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)
    const unreadOnly = searchParams.get('unreadOnly') === '1'

    const result = await notificationService.list(user.id, { limit, unreadOnly })

    return NextResponse.json(result, { status: 200, headers: CACHE.noStore })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Email not verified'
          ? 403
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
