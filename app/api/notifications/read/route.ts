import { NextRequest, NextResponse } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import { notificationService } from '@/services/notification.service'
import { markNotificationsReadSchema } from '@/validators/notification.schema'

export async function POST(req: NextRequest) {
  try {
    const user = await requireEmailVerified(req)
    const body = markNotificationsReadSchema.parse(await req.json())

    let unreadCount: number
    if (body.all) {
      unreadCount = await notificationService.markAllRead(user.id)
    } else if (body.ids?.length) {
      unreadCount = await notificationService.markRead(user.id, body.ids)
    } else {
      return NextResponse.json({ error: 'Provide ids or all: true' }, { status: 400 })
    }

    return NextResponse.json({ unreadCount })
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
