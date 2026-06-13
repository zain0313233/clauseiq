import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminRepository } from '@/repositories/admin.repository'
import { adminService } from '@/services/admin.service'
import { updateUserRoleSchema } from '@/validators/admin.schema'
import { CACHE } from '@/lib/cache-headers'
import { hasPermission } from '@/lib/rbac'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminUser(req)
    const { id } = await params
    const user = await adminRepository.getUserDetail(id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ user }, { status: 200, headers: CACHE.noStore })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdminUser(req)
    const { id } = await params
    const body = updateUserRoleSchema.parse(await req.json())
    const user = await adminService.updateUserRole(actor.id, id, body.role)
    return NextResponse.json({ user }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
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

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdminUser(req)
    if (!hasPermission(actor.role, 'user:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    await adminService.deleteUser(actor.id, id)
    return NextResponse.json({ message: 'User deleted' }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
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
