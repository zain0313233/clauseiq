import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { accessControlService } from '@/services/access-control.service'
import { adminUnblockSchema } from '@/validators/admin.schema'
import { CACHE } from '@/lib/cache-headers'

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req)
    const { userId, note } = adminUnblockSchema.parse(await req.json())

    await accessControlService.adminUnblock(admin.id, userId, note)

    return NextResponse.json(
      { message: 'User access restored' },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unblock failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : message === 'User not found'
            ? 404
            : 400
    return NextResponse.json({ error: message }, { status })
  }
}
