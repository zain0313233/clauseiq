"use client"

import type { CSSProperties } from "react"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChatDocument } from "./types"

type ChatInboxProps = {
  documents: ChatDocument[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onRefresh: () => void
  lastPreview: Record<string, string>
  width?: number // desktop only — mobile stays full width
}

export function ChatInbox({
  documents,
  selectedId,
  loading,
  onSelect,
  onRefresh,
  lastPreview,
  width,
}: ChatInboxProps) {
  const readyDocs = documents.filter((d) => d.status === "ready")
  const otherDocs = documents.filter((d) => d.status !== "ready")

  return (
    <div
      className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card text-card-foreground md:w-[var(--inbox-width,20rem)]"
      style={
        width != null
          ? ({ "--inbox-width": `${width}px` } as CSSProperties)
          : undefined
      }
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground">
          Inbox
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-foreground/70 hover:text-foreground"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading && documents.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-foreground/65">
            No documents yet. Upload a contract to start chatting.
          </p>
        ) : (
          <div className="space-y-1 p-2">
            {readyDocs.length > 0 && (
              <>
                <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground/55">
                  Ready
                </p>
                {readyDocs.map((doc) => (
                  <InboxItem
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    preview={lastPreview[doc.id]}
                    onSelect={onSelect}
                  />
                ))}
              </>
            )}
            {otherDocs.length > 0 && (
              <>
                <p className="mt-2 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground/55">
                  Processing
                </p>
                {otherDocs.map((doc) => (
                  <InboxItem
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    preview={lastPreview[doc.id]}
                    onSelect={onSelect}
                    disabled={doc.status !== "ready"}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InboxItem({
  doc,
  selected,
  preview,
  onSelect,
  disabled,
}: {
  doc: ChatDocument
  selected: boolean
  preview?: string
  onSelect: (id: string) => void
  disabled?: boolean
}) {
  const initial = doc.title.charAt(0).toUpperCase()

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(doc.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-foreground transition-colors",
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-transparent hover:border-border/60 hover:bg-muted/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-primary/15 text-primary"
        )}
      >
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight text-foreground">
            {doc.title}
          </p>
          {doc.status === "ready" && (
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] leading-tight text-foreground/65">
          {preview || "Ask questions about this contract"}
        </p>
        <div className="mt-1.5">
          <Badge
            variant="outline"
            className={cn(
              "px-1.5 py-0 text-[10px] font-normal",
              doc.status === "ready"
                ? "border-emerald-500/30 text-emerald-400"
                : doc.status === "failed"
                  ? "border-red-500/30 text-red-400"
                  : "border-amber-500/30 text-amber-400"
            )}
          >
            {doc.status}
          </Badge>
        </div>
      </div>
    </button>
  )
}
