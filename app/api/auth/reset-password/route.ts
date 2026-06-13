import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/services/otp.service'
import { resetPasswordSchema } from '@/validators/otp.schema'

export async function POST(req: NextRequest) {
  try {
    const body = resetPasswordSchema.parse(await req.json())
    await otpService.resetPassword(body.email, body.code, body.password)

    return NextResponse.json({
      message: 'Password reset successfully. Please sign in.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
