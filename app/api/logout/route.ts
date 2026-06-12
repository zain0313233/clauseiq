import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-cookie'
import { requireAuthUser } from '@/lib/auth-session'
import { userService } from '@/services/user.service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    await userService.logout(user.id)
    const response = NextResponse.json({ message: 'Logged out' }, { status: 200 })
    clearAuthCookie(response)
    return response
  } catch {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    clearAuthCookie(response)
    return response
  }
}
