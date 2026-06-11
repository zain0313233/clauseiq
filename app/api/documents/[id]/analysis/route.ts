import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { documentRepository } from '@/repositories/document.repository'
import { analysisRepository } from '@/repositories/analysis.repository'
import { userRepository } from '@/repositories/user.repository'
import { hasPermission } from '@/lib/rbac'
import { aiService } from '@/services/ai.service'

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

    const analysis = document.analysis ?? await analysisRepository.findByDocumentId(id)

    return NextResponse.json({ analysis }, { status: 200 })
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
    if (document.status !== 'ready') {
      return NextResponse.json({ error: 'Document must be ready before analysis' }, { status: 400 })
    }

    await aiService.triggerAnalysis({
      document_id: id,
      file_url: document.fileUrl,
      file_type: document.fileType,
    })

    return NextResponse.json({ message: 'Analysis started' }, { status: 202 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
