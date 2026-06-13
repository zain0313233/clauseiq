"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { fetchJson } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AdminDocumentReviewSheet } from "@/components/admin/admin-document-review-sheet"
import type { PaginationMeta } from "@/lib/pagination"

type AdminDocument = {
  id: string
  title: string
  status: string
  contractType: string | null
  riskLevel: string | null
  contentReviewStatus: string
  queriesEnabled: boolean
  createdAt: string
  owner: { id: string; email: string; name: string | null }
}

function reviewStatusBadge(status: string) {
  if (status === "valid")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
        valid
      </Badge>
    )
  if (status === "suspicious")
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
        suspicious
      </Badge>
    )
  if (status === "rejected")
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
        blocked
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      pending
    </Badge>
  )
}

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reviewDocId, setReviewDocId] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "documents", page, search, statusFilter],
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search ? { search } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      })
      return fetchJson<{ documents: AdminDocument[]; pagination: PaginationMeta }>(
        `/api/platform/documents?${qs}`
      )
    },
  })

  async function handleDelete(doc: AdminDocument) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    try {
      const res = await fetch(`/api/platform/documents/${doc.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Delete failed")
      toast.success("Document deleted")
      void queryClient.invalidateQueries({ queryKey: ["admin", "documents"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  function openReview(docId: string) {
    setReviewDocId(docId)
    setReviewOpen(true)
  }

  const documents = data?.documents ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">All documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review uploads for validity, security, and abuse before users spend AI
          tokens in chat
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput.trim())
            setPage(1)
          }}
        >
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search title or owner email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Document</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Review</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                      onClick={() => openReview(doc.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/users/${doc.owner.id}`}
                          className="text-xs hover:text-primary"
                        >
                          {doc.owner.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {reviewStatusBadge(doc.contentReviewStatus)}
                        {!doc.queriesEnabled && (
                          <p className="mt-1 text-[10px] text-red-400">chat off</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {doc.riskLevel ?? "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === doc.id}
                          onClick={() => void handleDelete(doc)}
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AdminDocumentReviewSheet
        documentId={reviewDocId}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onUpdated={() =>
          void queryClient.invalidateQueries({ queryKey: ["admin", "documents"] })
        }
      />
    </div>
  )
}
