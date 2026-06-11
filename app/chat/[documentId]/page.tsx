"use client"

import { use } from "react"
import { ChatWorkspace } from "@/components/chat/chat-workspace"

export default function ChatDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = use(params)
  return <ChatWorkspace initialDocumentId={documentId} />
}
