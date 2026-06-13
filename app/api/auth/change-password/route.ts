import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { adminService } from '@/services/admin.service'
import { changePasswordSchema } from '@/validators/admin.schema'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    const body = changePasswordSchema.parse(await req.json())
    await adminService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword
    )
    return NextResponse.json(
      { message: 'Password updated. Please sign in again.' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Current password is incorrect'
          ? 400
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}
