import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { validateUploadFile } from '@/lib/file-validation'
import { userRepository } from '@/repositories/user.repository'
import { templateRepository } from '@/repositories/template.repository'
import { templateService } from '@/services/template.service'
import { hasPermission } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    const userId = user.id
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const templates = await templateRepository.findByUserId(userId)
    return NextResponse.json({ templates }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser(req)
    const userId = user.id
    if (!hasPermission(user.role, 'document:upload')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const type = (formData.get('type') as string) || 'other'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { mime } = await validateUploadFile(file)

    const template = await templateService.uploadTemplate(
      file,
      userId,
      name.trim(),
      type,
      mime
    )

    return NextResponse.json({ message: 'Template uploaded', template }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
