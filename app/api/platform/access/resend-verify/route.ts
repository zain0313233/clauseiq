import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminService } from '@/services/admin.service'
import { userRepository } from '@/repositories/user.repository'
import { adminUserIdSchema } from '@/validators/admin.schema'
import { CACHE } from '@/lib/cache-headers'

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser(req)
    const { userId } = adminUserIdSchema.parse(await req.json())
    const target = await userRepository.findById(userId)
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    await adminService.resendVerification(target.email)
    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : message === 'User not found'
            ? 404
            : message === 'Email is already verified'
              ? 400
              : message === 'Too many codes sent. Please try again later.'
                ? 429
                : 400
    return NextResponse.json({ error: message }, { status })
  }
}
