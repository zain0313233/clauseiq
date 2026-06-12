"use client"

import type { CSSProperties } from "react"
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChatDocument } from "./types"

const INBOX_COLLAPSED_WIDTH = 72

type ChatInboxProps = {
  documents: ChatDocument[]
  selectedId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onRefresh: () => void
  lastPreview: Record<string, string>
  width?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function ChatInbox({
  documents,
  selectedId,
  loading,
  onSelect,
  onRefresh,
  lastPreview,
  width,
  collapsed = false,
  onToggleCollapse,
}: ChatInboxProps) {
  const readyDocs = documents.filter((d) => d.status === "ready")
  const otherDocs = documents.filter((d) => d.status !== "ready")

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-border/60 bg-card text-card-foreground transition-[width] duration-300 ease-in-out md:w-[var(--inbox-width,20rem)]",
        collapsed && "md:w-[var(--inbox-collapsed-width,4.5rem)]"
      )}
      style={
        {
          "--inbox-width": collapsed ? `${INBOX_COLLAPSED_WIDTH}px` : `${width ?? 320}px`,
          "--inbox-collapsed-width": `${INBOX_COLLAPSED_WIDTH}px`,
        } as CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-border/60 py-3",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground">
            Inbox
          </h2>
        )}
        <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1")}>
          {!collapsed && (
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
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-foreground/70 hover:text-foreground"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-foreground/70 hover:text-foreground"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand inbox" : "Collapse inbox"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading && documents.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          !collapsed && (
            <p className="px-4 py-8 text-center text-xs text-foreground/65">
              No documents yet. Upload a contract to start chatting.
            </p>
          )
        ) : (
          <div
            className={cn(
              collapsed
                ? "flex flex-col items-center gap-2 py-2"
                : "space-y-1 p-2"
            )}
          >
            {readyDocs.length > 0 && (
              <>
                {!collapsed && (
                  <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground/55">
                    Ready
                  </p>
                )}
                {readyDocs.map((doc) => (
                  <InboxItem
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    preview={lastPreview[doc.id]}
                    onSelect={onSelect}
                    collapsed={collapsed}
                  />
                ))}
              </>
            )}
            {otherDocs.length > 0 && (
              <>
                {!collapsed && (
                  <p className="mt-2 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground/55">
                    Processing
                  </p>
                )}
                {otherDocs.map((doc) => (
                  <InboxItem
                    key={doc.id}
                    doc={doc}
                    selected={selectedId === doc.id}
                    preview={lastPreview[doc.id]}
                    onSelect={onSelect}
                    disabled={doc.status !== "ready"}
                    collapsed={collapsed}
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
  collapsed,
}: {
  doc: ChatDocument
  selected: boolean
  preview?: string
  onSelect: (id: string) => void
  disabled?: boolean
  collapsed?: boolean
}) {
  const initial = doc.title.charAt(0).toUpperCase()

  if (collapsed) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={doc.title}
        onClick={() => onSelect(doc.id)}
        className={cn(
          "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
          selected
            ? "bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-card"
            : "bg-primary/15 text-primary hover:bg-primary/25",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {initial}
        {doc.status === "ready" && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
        )}
      </button>
    )
  }

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
