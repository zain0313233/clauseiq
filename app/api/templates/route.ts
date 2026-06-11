import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { userRepository } from '@/repositories/user.repository'
import { templateRepository } from '@/repositories/template.repository'
import { templateService } from '@/services/template.service'
import { hasPermission } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  try {
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
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
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!hasPermission(user.role, 'document:upload')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const type = (formData.get('type') as string) || 'other'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and DOCX files allowed' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    const template = await templateService.uploadTemplate(
      file,
      userId,
      name.trim(),
      type
    )

    return NextResponse.json({ message: 'Template uploaded', template }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
