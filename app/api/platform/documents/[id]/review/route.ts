import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminService } from '@/services/admin.service'
import { CACHE } from '@/lib/cache-headers'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser(req)
    const { id } = await params

    const { detail, result } = await adminService.runDocumentContentReview(
      admin.id,
      id
    )

    return NextResponse.json(
      { document: detail, review: result },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Review failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : message === 'Document not found'
            ? 404
            : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdminUser(req)
    const { id } = await params
    const body = await req.json()

    const status = body.status as
      | 'valid'
      | 'suspicious'
      | 'rejected'
      | 'pending'
      | undefined
    if (
      !status ||
      !['valid', 'suspicious', 'rejected', 'pending'].includes(status)
    ) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const queriesEnabled =
      typeof body.queries_enabled === 'boolean'
        ? body.queries_enabled
        : undefined

    const document = await adminService.setDocumentReviewStatus(
      admin.id,
      id,
      status,
      queriesEnabled
    )

    return NextResponse.json({ document }, { status: 200, headers: CACHE.noStore })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed'
    const status =
      message === 'Forbidden'
        ? 403
        : message === 'Unauthorized' || message === 'Email not verified'
          ? 401
          : message === 'Document not found'
            ? 404
            : 400
    return NextResponse.json({ error: message }, { status })
  }
}
