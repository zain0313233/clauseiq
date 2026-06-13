import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminRepository } from '@/repositories/admin.repository'
import { parseLimit, parsePage } from '@/lib/pagination'
import { CACHE } from '@/lib/cache-headers'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req)
    const { searchParams } = new URL(req.url)
    const page = parsePage(searchParams.get('page'))
    const limit = parseLimit(searchParams.get('limit'), 10, 50)
    const search = searchParams.get('search') ?? undefined
    const role = searchParams.get('role') ?? undefined
    const verified = searchParams.get('verified') ?? undefined
    const needsAction = searchParams.get('needsAction') ?? undefined

    const result = await adminRepository.listUsers({
      page,
      limit,
      search,
      role,
      verified,
      needsAction,
    })

    return NextResponse.json(result, { status: 200, headers: CACHE.noStore })
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
