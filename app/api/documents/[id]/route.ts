import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { removeStorageObject } from '@/lib/storage'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(id)
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(id)
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await removeStorageObject(document.fileUrl)

    // Delete from DB (cascades to chunks)
    await documentRepository.delete(id)

    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}