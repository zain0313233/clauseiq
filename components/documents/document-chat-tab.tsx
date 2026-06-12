"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, BookOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessageBubble } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { CLAUSEMIND_NAME, CLAUSEMIND_WELCOME } from "@/lib/clausemind"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/components/chat/types"
import type { QueryMode } from "@/lib/clausemind"

type DocumentChatTabProps = {
  documentId: string
  documentTitle: string
  initialQuestion?: string
  initialMode?: QueryMode
  onQuestionSent?: () => void
}

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function DocumentChatTab({
  documentId,
  documentTitle,
  initialQuestion,
  initialMode = "default",
  onQuestionSent,
}: DocumentChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      type: "text",
      content: CLAUSEMIND_WELCOME(documentTitle),
      time: now(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [plainEnglish, setPlainEnglish] = useState(initialMode === "plain_english")
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(
    initialQuestion ?? null
  )

  const sendText = useCallback(
    async (question: string, mode: QueryMode = plainEnglish ? "plain_english" : "default") => {
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        type: "text",
        content: question,
        time: now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const res = await fetch("/api/query", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_id: documentId,
            question,
            mode,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Request failed")

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            type: "text",
            content: data.answer || "No answer received.",
            sources: data.sources,
            confidence: data.confidence,
            time: now(),
          },
        ])
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            type: "text",
            content: err instanceof Error ? err.message : "Something went wrong",
            time: now(),
          },
        ])
      } finally {
        setLoading(false)
        onQuestionSent?.()
      }
    },
    [documentId, plainEnglish, onQuestionSent]
  )

  useEffect(() => {
    if (pendingQuestion) {
      const q = pendingQuestion
      setPendingQuestion(null)
      void sendText(q, initialMode)
    }
  }, [pendingQuestion, sendText, initialMode])

  return (
    <div className="flex h-[min(520px,60vh)] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/40">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Ask {CLAUSEMIND_NAME} about this contract
        </p>
        <button
          type="button"
          onClick={() => setPlainEnglish((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            plainEnglish
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
          )}
        >
          <BookOpen className="h-3 w-3" />
          Plain English
        </button>
      </div>

      <ScrollArea className="flex-1 bg-muted/10">
        <div className="space-y-4 p-4">
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                CM
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {plainEnglish ? "Simplifying in plain English…" : `${CLAUSEMIND_NAME} is analyzing…`}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <ChatInput
        disabled={loading}
        loading={loading}
        onSendText={(text) => sendText(text)}
        onSendImage={() => {}}
        onSendVoice={() => {}}
      />
    </div>
  )
}
