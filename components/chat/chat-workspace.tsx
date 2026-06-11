"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  MessageSquare,
  Loader2,
  X,
  FileText,
  Sparkles,
  AlertCircle,
  BookOpen,
  FileSearch,
  Languages,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInbox } from "./chat-inbox"
import { ChatMessageBubble } from "./chat-message"
import { ChatInput } from "./chat-input"
import { authHeaders } from "@/lib/auth-client"
import {
  CLAUSEMIND_NAME,
  CLAUSEMIND_TAGLINE,
  CLAUSEMIND_WELCOME,
  type QuerySource,
} from "@/lib/clausemind"
import { cn } from "@/lib/utils"
import {
  useDocumentPolling,
  useSingleDocumentPolling,
} from "@/hooks/use-document-polling"
import { useAllDocumentsQuery } from "@/hooks/use-all-documents-query"
import { queryKeys } from "@/lib/query-keys"
import type { ChatDocument, ChatMessage } from "./types"

const WELCOME_MESSAGE = (title: string): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  type: "text",
  content: CLAUSEMIND_WELCOME(title),
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
})

const quickActions = [
  { label: "Termination clause", icon: AlertCircle },
  { label: "Payment terms", icon: BookOpen },
  { label: "Liability limits", icon: FileSearch },
  { label: "Key obligations", icon: Sparkles },
]

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

type ChatWorkspaceProps = {
  initialDocumentId?: string
}

export function ChatWorkspace({ initialDocumentId }: ChatWorkspaceProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    data: documents = [],
    isLoading: loadingDocs,
    refetch: refetchDocuments,
  } = useAllDocumentsQuery()
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDocumentId ?? null
  )
  const [messagesByDoc, setMessagesByDoc] = useState<
    Record<string, ChatMessage[]>
  >({})
  const [loading, setLoading] = useState(false)
  const [plainEnglish, setPlainEnglish] = useState(false)
  const [inboxWidth, setInboxWidth] = useState(320)
  const resizingInbox = useRef(false)
  const splitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizingInbox.current || !splitRef.current) return
      const left = splitRef.current.getBoundingClientRect().left
      setInboxWidth(Math.min(520, Math.max(220, e.clientX - left)))
    }
    function onUp() {
      resizingInbox.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  useDocumentPolling(documents, () => {
    void refetchDocuments()
  })

  useEffect(() => {
    if (initialDocumentId) setSelectedId(initialDocumentId)
  }, [initialDocumentId])

  const loadConversation = useCallback(async (docId: string, title: string) => {
    try {
      const res = await fetch(`/api/conversations/${docId}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok || !data.messages?.length) {
        setMessagesByDoc((prev) => ({
          ...prev,
          [docId]: [WELCOME_MESSAGE(title)],
        }))
        return
      }

      const loaded: ChatMessage[] = data.messages.map(
        (m: {
          id: string
          role: string
          content: string
          metadata?: { sources?: QuerySource[]; confidence?: string }
          createdAt: string
        }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          type: "text" as const,
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          sources: m.metadata?.sources,
          confidence: m.metadata?.confidence as ChatMessage["confidence"],
        })
      )

      setMessagesByDoc((prev) => ({ ...prev, [docId]: loaded }))
    } catch {
      setMessagesByDoc((prev) => ({
        ...prev,
        [docId]: [WELCOME_MESSAGE(title)],
      }))
    }
  }, [])

  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedId) ?? null,
    [documents, selectedId]
  )

  const handleStatusChange = useCallback(
    (status: string) => {
      if (!selectedId) return
      queryClient.setQueryData<{ documents: ChatDocument[] }>(
        queryKeys.documents.all(),
        (prev) => ({
          documents: (prev?.documents ?? []).map((d) =>
            d.id === selectedId ? { ...d, status } : d
          ),
        })
      )
    },
    [selectedId, queryClient]
  )

  useSingleDocumentPolling(
    selectedId,
    selectedDoc?.status,
    handleStatusChange
  )

  useEffect(() => {
    if (selectedId && selectedDoc && !messagesByDoc[selectedId]) {
      loadConversation(selectedId, selectedDoc.title)
    }
  }, [selectedId, selectedDoc, messagesByDoc, loadConversation])

  const messages = useMemo(() => {
    if (!selectedId) return []
    if (messagesByDoc[selectedId]) return messagesByDoc[selectedId]
    if (selectedDoc) return [WELCOME_MESSAGE(selectedDoc.title)]
    return []
  }, [selectedId, messagesByDoc, selectedDoc])

  const lastPreview = useMemo(() => {
    const previews: Record<string, string> = {}
    for (const [docId, msgs] of Object.entries(messagesByDoc)) {
      const last = msgs[msgs.length - 1]
      if (last) {
        previews[docId] =
          last.type === "image"
            ? "📷 Image"
            : last.type === "voice"
              ? "🎤 Voice message"
              : last.content.slice(0, 60)
      }
    }
    return previews
  }, [messagesByDoc])

  function selectDocument(id: string) {
    const doc = documents.find((d) => d.id === id)
    if (!doc || doc.status !== "ready") return
    setSelectedId(id)
    router.push(`/chat/${id}`, { scroll: false })
    if (!messagesByDoc[id]) {
      loadConversation(id, doc.title)
    }
  }

  function appendMessage(docId: string, message: ChatMessage) {
    setMessagesByDoc((prev) => ({
      ...prev,
      [docId]: [...(prev[docId] || []), message],
    }))
  }

  async function sendText(question: string) {
    if (!selectedId || !selectedDoc) return

    appendMessage(selectedId, {
      id: uid(),
      role: "user",
      type: "text",
      content: question,
      time: now(),
    })
    setLoading(true)

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          document_id: selectedId,
          question,
          mode: plainEnglish ? "plain_english" : "default",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Request failed")

      appendMessage(selectedId, {
        id: uid(),
        role: "assistant",
        type: "text",
        content: data.answer || "No answer received.",
        sources: data.sources,
        confidence: data.confidence,
        time: now(),
      })
    } catch (err) {
      appendMessage(selectedId, {
        id: uid(),
        role: "assistant",
        type: "text",
        content: err instanceof Error ? err.message : "Something went wrong",
        time: now(),
      })
    } finally {
      setLoading(false)
    }
  }

  function sendImage(file: File, caption: string) {
    if (!selectedId) return
    const url = URL.createObjectURL(file)
    appendMessage(selectedId, {
      id: uid(),
      role: "user",
      type: "image",
      content: caption,
      attachmentUrl: url,
      time: now(),
    })
    appendMessage(selectedId, {
      id: uid(),
      role: "assistant",
      type: "text",
      content:
        "Image received. Image analysis will be available soon — for now, please describe what you'd like to know about this document in text.",
      time: now(),
    })
  }

  function sendVoice(duration: string) {
    if (!selectedId) return
    appendMessage(selectedId, {
      id: uid(),
      role: "user",
      type: "voice",
      content: "",
      voiceDuration: duration,
      time: now(),
    })
    appendMessage(selectedId, {
      id: uid(),
      role: "assistant",
      type: "text",
      content:
        "Voice message received. Voice transcription will be available soon — please type your question for now.",
      time: now(),
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/60 px-6 py-4">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">
          Chat
        </h1>
        <p className="mt-1 text-sm leading-normal text-muted-foreground">
          {CLAUSEMIND_NAME} — {CLAUSEMIND_TAGLINE}. Select a contract to start.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div
          ref={splitRef}
          className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card/20 shadow-sm"
        >
          <ChatInbox
            documents={documents}
            selectedId={selectedId}
            loading={loadingDocs}
            onSelect={selectDocument}
            onRefresh={() => void refetchDocuments()}
            lastPreview={lastPreview}
            width={inboxWidth}
          />

          <button
            type="button"
            aria-label="Resize inbox"
            className="hidden w-1.5 shrink-0 cursor-col-resize border-0 bg-border/40 transition-colors hover:bg-primary/50 md:block"
            onMouseDown={() => {
              resizingInbox.current = true
              document.body.style.cursor = "col-resize"
              document.body.style.userSelect = "none"
            }}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background/50">
            {!selectedDoc ? (
              <EmptyChatState />
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between rounded-t-2xl bg-primary px-4 py-3 text-primary-foreground md:rounded-none">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                      {selectedDoc.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {selectedDoc.title}
                      </p>
                      <p className="text-[11px] leading-tight text-primary-foreground/75">
                        {selectedDoc.status === "ready"
                          ? `Ready · ${CLAUSEMIND_NAME} active`
                          : selectedDoc.status === "processing"
                            ? "Processing document…"
                            : selectedDoc.status}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-primary-foreground hover:bg-white/15"
                    onClick={() => {
                      setSelectedId(null)
                      router.push("/chat", { scroll: false })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/20">
                  <div className="space-y-4 p-4">
                    {messages.map((msg) => (
                      <ChatMessageBubble key={msg.id} message={msg} />
                    ))}

                    {loading && (
                      <div className="flex gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                          AI
                        </div>
                        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {CLAUSEMIND_NAME} is analyzing…
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 border-t border-border/40 bg-card/30 px-4 pt-3">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setPlainEnglish((v) => !v)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                        plainEnglish
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary"
                      )}
                    >
                      <Languages className="h-3 w-3" />
                      Plain English
                    </button>
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.label}
                          type="button"
                          disabled={loading}
                          onClick={() => sendText(action.label)}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <Icon className="h-3 w-3" />
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <ChatInput
                  disabled={selectedDoc.status !== "ready"}
                  loading={loading}
                  onSendText={sendText}
                  onSendImage={sendImage}
                  onSendVoice={sendVoice}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyChatState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">Select a document</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Choose a contract from the inbox to start a conversation with{" "}
          {CLAUSEMIND_NAME}
        </p>
      </div>
      <Link
        href="/dashboard/upload"
        className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
      >
        <FileText className="h-3.5 w-3.5" />
        Upload a new document
      </Link>
    </div>
  )
}
