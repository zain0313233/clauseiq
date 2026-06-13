import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { CACHE } from '@/lib/cache-headers'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          accessRestricted: user.accessRestricted,
          unblockRequestPending: user.unblockRequestPending,
        },
      },
      { status: 200, headers: CACHE.noStore }
    )
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
