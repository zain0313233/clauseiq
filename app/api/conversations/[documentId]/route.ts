import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { userRepository } from "@/repositories/user.repository"
import { documentRepository } from "@/repositories/document.repository"
import { conversationRepository } from "@/repositories/conversation.repository"
import { CACHE } from "@/lib/cache-headers"
import { normalizeStoredSources } from "@/lib/message-metadata"
import { hasPermission } from "@/lib/rbac"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params
    const { userId } = verifyToken(req)

    const user = await userRepository.findById(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!hasPermission(user.role, "conversation:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const document = await documentRepository.findById(documentId)
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 })
    if (document.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const conversation = await conversationRepository.findByUserAndDocument(
      userId,
      documentId
    )

    if (!conversation) {
      return NextResponse.json({ messages: [] }, { status: 200 })
    }

    const messages = conversation.messages.map((m) => {
      const metadata = m.metadata as {
        sources?: unknown
        confidence?: string
      } | null

      return {
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: metadata
          ? {
              confidence: metadata.confidence,
              sources: normalizeStoredSources(metadata.sources),
            }
          : null,
        createdAt: m.createdAt.toISOString(),
      }
    })

    return NextResponse.json(
      { messages },
      { status: 200, headers: CACHE.noStore }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed"
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
