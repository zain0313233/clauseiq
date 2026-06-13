import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { otpService } from '@/services/otp.service'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified' })
    }

    await otpService.sendCode(user.email, 'verify_email')
    return NextResponse.json({ message: 'Verification code sent' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Too many codes sent. Please try again later.'
          ? 429
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
