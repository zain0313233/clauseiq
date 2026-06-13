import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { auditLogService } from '@/services/audit-log.service'
import { parseLimit, parsePage } from '@/lib/pagination'
import { CACHE } from '@/lib/cache-headers'
import { buildPagination } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req)
    const { searchParams } = new URL(req.url)
    const page = parsePage(searchParams.get('page'))
    const limit = parseLimit(searchParams.get('limit'), 20, 100)
    const targetUserId = searchParams.get('userId') ?? undefined
    const action = searchParams.get('action') ?? undefined

    if (targetUserId) {
      const logs = await auditLogService.listForUser(targetUserId, limit)
      return NextResponse.json({ logs }, { status: 200, headers: CACHE.noStore })
    }

    const result = await auditLogService.listRecent({ page, limit, action })
    return NextResponse.json(
      {
        logs: result.logs,
        pagination: buildPagination(result.total, page, limit),
      },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    const status =
      message === 'Forbidden' ? 403 : message === 'Unauthorized' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
