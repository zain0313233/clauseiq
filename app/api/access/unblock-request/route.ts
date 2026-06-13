import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { accessControlService } from '@/services/access-control.service'

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)

    if (!user.accessRestricted) {
      return NextResponse.json(
        { error: 'Account is not restricted' },
        { status: 400 }
      )
    }

    if (user.unblockRequestPending) {
      return NextResponse.json(
        { message: 'Unblock request already sent. An admin will review it soon.' },
        { status: 200 }
      )
    }

    await accessControlService.requestUnblock(user.id, clientIp(req))

    return NextResponse.json(
      { message: 'Unblock request sent to admin.' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
