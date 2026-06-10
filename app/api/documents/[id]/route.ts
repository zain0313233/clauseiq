import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { documentRepository } from '@/repositories/document.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(params.id)
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    if (document.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from Supabase Storage
    const filePath = document.fileUrl.split('/documents/')[1]
    await supabaseAdmin.storage.from('documents').remove([filePath])

    // Delete from DB (cascades to chunks)
    await documentRepository.delete(params.id)

    return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}