import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { removeStorageObject } from '@/lib/storage'
import { deleteDocumentVectorsWithRetry } from '@/lib/pinecone-delete'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuthUser(req)
    const userId = user.id
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(id)
    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuthUser(req)
    const userId = user.id
    if (!hasPermission(user.role, 'document:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(id)
    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await deleteDocumentVectorsWithRetry(id, userId)

    await removeStorageObject(document.fileUrl)

    await documentRepository.delete(id)

    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    const isEngineAuth =
      message.includes('AI engine authentication failed') ||
      message.includes('ENGINE_API_SECRET')
    const status = isEngineAuth ? 502 : message.includes('purge') ? 502 : 400
    return NextResponse.json({ error: message }, { status })
  }
}