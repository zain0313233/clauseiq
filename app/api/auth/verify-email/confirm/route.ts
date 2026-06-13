import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { otpService } from '@/services/otp.service'
import { verifyEmailSchema } from '@/validators/otp.schema'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    const body = verifyEmailSchema.parse(await req.json())

    await otpService.verifyEmail(user.email, body.code)

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status = message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
