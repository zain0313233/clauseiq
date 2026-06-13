import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/services/otp.service'
import { forgotPasswordSchema } from '@/validators/otp.schema'

export async function POST(req: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await req.json())

    try {
      await otpService.sendCode(body.email, 'reset_password')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'Too many codes sent. Please try again later.') {
        return NextResponse.json({ error: msg }, { status: 429 })
      }
    }

    return NextResponse.json({
      message:
        'If an account exists for that email, a reset code has been sent.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
