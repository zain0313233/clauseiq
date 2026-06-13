import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminRepository } from '@/repositories/admin.repository'
import { documentRepository } from '@/repositories/document.repository'
import { deleteDocumentVectorsWithRetry } from '@/lib/pinecone-delete'
import { removeStorageObject } from '@/lib/storage'
import { CACHE } from '@/lib/cache-headers'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAdminUser(req)
    const { id } = await params

    const document = await adminRepository.getDocumentDetail(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document }, { status: 200, headers: CACHE.noStore })
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

export async function DELETE(req: NextRequest, { params }: RouteParams) {  try {
    await requireAdminUser(req)
    const { id } = await params

    const document = await documentRepository.findById(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    try {
      await deleteDocumentVectorsWithRetry(id, document.userId)
    } catch {
      // continue
    }

    try {
      await removeStorageObject(document.fileUrl)
    } catch {
      // continue
    }

    await documentRepository.delete(id)

    return NextResponse.json({ message: 'Document deleted' }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed'
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
