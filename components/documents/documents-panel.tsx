"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  FileText,
  Trash2,
  MessageSquare,
  Loader2,
  Upload,
  RefreshCw,
  Search,
  File,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { authHeaders } from "@/lib/auth-client"
import { useDocumentPolling } from "@/hooks/use-document-polling"
import { cn } from "@/lib/utils"
import {
  contractTypeLabel,
  getExpirationDate,
  isExpiringWithinDays,
  isHighRisk,
  hasUnlimitedLiability,
  matchesPortfolioFilter,
  type PortfolioDocument,
  type PortfolioFilter,
} from "@/lib/document-filters"

type Document = PortfolioDocument & {
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
}

type FilterTab = "all" | "ready" | "processing" | "failed"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fileType(doc: Document) {
  return doc.fileType.includes("pdf") || doc.fileName.endsWith(".pdf")
    ? "PDF"
    : "DOCX"
}

function statusConfig(status: string) {
  switch (status) {
    case "ready":
      return {
        label: "Ready",
        icon: CheckCircle2,
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dot: "bg-emerald-500",
      }
    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        badge: "border-red-500/30 bg-red-500/10 text-red-400",
        dot: "bg-red-500",
      }
    default:
      return {
        label: "Processing",
        icon: Clock,
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        dot: "bg-amber-500",
      }
  }
}

export function DocumentsPanel() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [portfolioFilter, setPortfolioFilter] = useState<PortfolioFilter>("all")

  async function fetchDocuments() {
    setLoading(true)
    try {
      const res = await fetch("/api/documents", { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setDocuments(data.documents || [])
    } catch {
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Document deleted")
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  useDocumentPolling(documents, fetchDocuments)

  const stats = useMemo(
    () => ({
      total: documents.length,
      ready: documents.filter((d) => d.status === "ready").length,
      processing: documents.filter(
        (d) => d.status === "processing" || d.status === "pending"
      ).length,
      failed: documents.filter((d) => d.status === "failed").length,
    }),
    [documents]
  )

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        !search.trim() ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase())

      const matchesFilter =
        filter === "all" ||
        (filter === "ready" && doc.status === "ready") ||
        (filter === "processing" &&
          (doc.status === "processing" || doc.status === "pending")) ||
        (filter === "failed" && doc.status === "failed")

      const matchesPortfolio = matchesPortfolioFilter(doc, portfolioFilter)

      return matchesSearch && matchesFilter && matchesPortfolio
    })
  }, [documents, search, filter, portfolioFilter])

  const portfolioCounts = useMemo(
    () => ({
      expiring: documents.filter((d) => isExpiringWithinDays(d)).length,
      highRisk: documents.filter((d) => isHighRisk(d)).length,
      unlimited: documents.filter((d) => hasUnlimitedLiability(d)).length,
    }),
    [documents]
  )

  const portfolioTabs: {
    key: PortfolioFilter
    label: string
    count?: number
  }[] = [
    { key: "all", label: "All contracts" },
    { key: "expiring", label: "Expiring ≤60d", count: portfolioCounts.expiring },
    { key: "high_risk", label: "High risk", count: portfolioCounts.highRisk },
    {
      key: "unlimited_liability",
      label: "Unlimited liability",
      count: portfolioCounts.unlimited,
    },
  ]

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "ready", label: "Ready", count: stats.ready },
    { key: "processing", label: "Processing", count: stats.processing },
    { key: "failed", label: "Failed", count: stats.failed },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
            Documents
          </h1>
          <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
            Manage and analyze your uploaded contracts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={fetchDocuments}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Link
            href="/dashboard/upload"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload new
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Ready", value: stats.ready, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Processing", value: stats.processing, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Failed", value: stats.failed, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 bg-card/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.bg)}>
                <span className={cn("text-lg font-bold leading-none", s.color)}>
                  {s.value}
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-background/60 pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0 text-[10px]",
                    filter === tab.key
                      ? "bg-primary-foreground/20"
                      : "bg-background/80"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
            <span className="mr-1 self-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Portfolio
            </span>
            {portfolioTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPortfolioFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  portfolioFilter === tab.key
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-full bg-background/80 px-1.5 py-0 text-[10px]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card className="border-border/60 bg-card/40 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading documents…</p>
            </div>
          ) : documents.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">No matches found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different search or filter
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  setSearch("")
                  setFilter("all")
                  setPortfolioFilter("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  deleting={deleting === doc.id}
                  onDelete={() => handleDelete(doc.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          Showing {filtered.length} of {documents.length} document
          {documents.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

function DocumentRow({
  doc,
  deleting,
  onDelete,
}: {
  doc: Document
  deleting: boolean
  onDelete: () => void
}) {
  const analysis = doc.analysis
  const type = fileType(doc)
  const status = statusConfig(doc.status)
  const StatusIcon = status.icon
  const canChat = doc.status === "ready"

  return (
    <div className="group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            type === "PDF" ? "bg-blue-500/10" : "bg-purple-500/10"
          )}
        >
          {type === "PDF" ? (
            <FileText className="h-5 w-5 text-blue-400" />
          ) : (
            <File className="h-5 w-5 text-purple-400" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {doc.title}
            </p>
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-[10px] font-normal", status.badge)}
            >
              <StatusIcon className="mr-1 inline h-2.5 w-2.5" />
              {status.label}
            </Badge>
            {contractTypeLabel(doc.contractType) && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                {contractTypeLabel(doc.contractType)}
              </Badge>
            )}
            {analysis?.status === "ready" && analysis.riskScore != null && (
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-[10px] font-normal",
                  analysis.riskLevel === "high"
                    ? "border-red-500/30 text-red-400"
                    : analysis.riskLevel === "medium"
                      ? "border-amber-500/30 text-amber-400"
                      : "border-emerald-500/30 text-emerald-400"
                )}
              >
                Risk {analysis.riskScore}
              </Badge>
            )}
            {isExpiringWithinDays(doc) && (
              <Badge
                variant="outline"
                className="border-amber-500/30 px-1.5 py-0 text-[10px] font-normal text-amber-400"
              >
                Expiring soon
              </Badge>
            )}
            {hasUnlimitedLiability(doc) && (
              <Badge
                variant="outline"
                className="border-red-500/30 px-1.5 py-0 text-[10px] font-normal text-red-400"
              >
                Unlimited liability
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                type === "PDF" ? "text-blue-400/80" : "text-purple-400/80"
              )}
            >
              {type}
            </span>
            <span>·</span>
            <span>{formatSize(doc.fileSize)}</span>
            <span>·</span>
            <span>{formatDate(doc.createdAt)}</span>
            {getExpirationDate(doc) && (
              <>
                <span>·</span>
                <span>Expires {getExpirationDate(doc)}</span>
              </>
            )}
            <span>·</span>
            <span className="truncate">{doc.fileName}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">
        {canChat && (
          <Link
            href={`/dashboard/documents/${doc.id}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-8 gap-1.5 text-xs"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Report
          </Link>
        )}
        {canChat ? (
          <Link
            href={`/chat/${doc.id}`}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "h-8 gap-1.5 text-xs"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </Link>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled
            title="Available when document is ready"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
          disabled={deleting}
          onClick={onDelete}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">No documents yet</p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Upload your first contract to start analyzing clauses with ClauseIQ AI
      </p>
      <Link
        href="/dashboard/upload"
        className={cn(buttonVariants({ size: "sm" }), "mt-5 gap-1.5")}
      >
        <Upload className="h-3.5 w-3.5" />
        Upload your first document
      </Link>
    </div>
  )
}
