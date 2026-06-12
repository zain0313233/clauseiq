import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth-session'
import { documentRepository } from '@/repositories/document.repository'
import { templateRepository } from '@/repositories/template.repository'
import { comparisonRepository } from '@/repositories/comparison.repository'
import { hasPermission } from '@/lib/rbac'
import { aiService } from '@/services/ai.service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuthUser(req)
    const userId = user.id
    const templateId = req.nextUrl.searchParams.get('templateId')
    if (!hasPermission(user.role, 'document:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const document = await documentRepository.findById(id)
    if (!document || document.userId !== userId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (templateId) {
      const comparison = await comparisonRepository.findByDocumentAndTemplate(id, templateId)
      return NextResponse.json({ comparison }, { status: 200 })
    }

    const comparisons = await comparisonRepository.findByDocumentId(id)
    return NextResponse.json({ comparisons }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

export async function POST(
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
    if (document.status !== 'ready') {
      return NextResponse.json({ error: 'Document must be ready before comparison' }, { status: 400 })
    }

    const body = await req.json()
    const { template_id } = body
    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
    }

    const template = await templateRepository.findById(template_id)
    if (!template || template.userId !== userId) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await comparisonRepository.upsertPending(id, template_id)

    await aiService.triggerComparison({
      document_id: id,
      template_id,
      user_id: userId,
      document_file_url: document.fileUrl,
      document_file_type: document.fileType,
      template_file_url: template.fileUrl,
      template_file_type: template.fileType,
      template_name: template.name,
    })

    return NextResponse.json({ message: 'Comparison started' }, { status: 202 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
