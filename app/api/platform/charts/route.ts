import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminRepository } from '@/repositories/admin.repository'
import { CACHE } from '@/lib/cache-headers'

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser(req)
    const charts = await adminRepository.getPlatformCharts()
    return NextResponse.json({ charts }, { status: 200, headers: CACHE.noStore })
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
