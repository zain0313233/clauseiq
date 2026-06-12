import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { userRepository } from '@/repositories/user.repository'
import { templateRepository } from '@/repositories/template.repository'
import { hasPermission } from '@/lib/rbac'
import { removeStorageObject } from '@/lib/storage'

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

    const template = await templateRepository.findById(id)
    if (!template || template.userId !== userId) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await removeStorageObject(template.fileUrl)

    await templateRepository.delete(id)

    return NextResponse.json({ message: 'Template deleted' }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
