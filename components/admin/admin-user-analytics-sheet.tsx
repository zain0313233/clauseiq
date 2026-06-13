"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Loader2,
  FileText,
  MessageSquare,
  Bell,
  Database,
  Trash2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { fetchJson } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ShieldAlert } from "lucide-react"

export type AdminUserAnalytics = {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: boolean
  emailVerifiedAt: string | null
  createdAt: string
  analytics: {
    documents: {
      total: number
      ready: number
      processing: number
      failed: number
    }
    chat: {
      conversations: number
      totalMessages: number
      userMessages: number
      assistantMessages: number
    }
    analyses: { complete: number; highRisk: number }
    comparisons: number
    vectorChunks: number
    notifications: number
    templates: number
  }
  documents: Array<{
    id: string
    title: string
    status: string
    riskLevel: string | null
    createdAt: string
  }>
  conversations: Array<{
    id: string
    documentTitle: string
    lastMessage: { content: string; role: string } | null
  }>
}

type AdminUserAnalyticsSheetProps = {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
  onDeleted?: () => void
}

function StatBox({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) {
  return (
    <Card className="border-border/60 bg-card/40">
      <CardContent className="p-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function AdminUserAnalyticsSheet({
  userId,
  open,
  onOpenChange,
  currentUserId,
  onDeleted,
}: AdminUserAnalyticsSheetProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () =>
      fetchJson<{ user: AdminUserAnalytics }>(`/api/platform/users/${userId}`),
    enabled: open && !!userId,
  })

  const { data: auditData } = useQuery({
    queryKey: ["admin", "audit-logs", userId],
    queryFn: () =>
      fetchJson<{
        logs: Array<{
          id: string
          action: string
          question: string | null
          reason: string | null
          createdAt: string
        }>
      }>(`/api/platform/audit-logs?userId=${userId}&limit=12`),
    enabled: open && !!userId,
  })

  const user = data?.user
  const isSelf = !!userId && userId === currentUserId

  async function resendVerify() {
    if (!userId) return
    try {
      const res = await fetch("/api/platform/access/resend-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Failed")
      toast.success("Verification email sent")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  async function deleteUser() {
    if (!user) return
    const a = user.analytics
    const summary = [
      `${a.documents.total} document(s)`,
      `${a.chat.conversations} chat(s)`,
      `${a.chat.totalMessages} message(s)`,
      `${a.vectorChunks} vector chunk(s) in Pinecone`,
      "all uploaded files",
    ].join(", ")

    if (
      !confirm(
        `Permanently delete ${user.email}?\n\nThis removes: ${summary}.\n\nThis cannot be undone.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/platform/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Delete failed")
      toast.success("User and all data deleted")
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{user?.name ?? "User analytics"}</SheetTitle>
          <SheetDescription>
            {user?.email ?? "Loading user profile…"}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <p className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load user"}
          </p>
        )}

        {user && (
          <div className="space-y-5 px-4 pb-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{user.role}</Badge>
              <Badge variant="outline">
                {user.emailVerified ? "verified" : "unverified"}
              </Badge>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documents
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatBox
                  label="Total uploaded"
                  value={user.analytics.documents.total}
                />
                <StatBox
                  label="Ready"
                  value={user.analytics.documents.ready}
                />
                <StatBox
                  label="Processing"
                  value={user.analytics.documents.processing}
                />
                <StatBox
                  label="Failed"
                  value={user.analytics.documents.failed}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chat activity
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatBox
                  label="Conversations"
                  value={user.analytics.chat.conversations}
                  sub="unique doc chats"
                />
                <StatBox
                  label="Total messages"
                  value={user.analytics.chat.totalMessages}
                  sub={`${user.analytics.chat.userMessages} user · ${user.analytics.chat.assistantMessages} AI`}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI & storage
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatBox
                  label="Analyses done"
                  value={user.analytics.analyses.complete}
                  sub={`${user.analytics.analyses.highRisk} high risk`}
                />
                <StatBox
                  label="Pinecone chunks"
                  value={user.analytics.vectorChunks}
                  sub="vector embeddings"
                />
                <StatBox
                  label="Comparisons"
                  value={user.analytics.comparisons}
                />
                <StatBox
                  label="Templates"
                  value={user.analytics.templates}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" />
                {user.analytics.notifications} notifications
              </span>
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Recent documents
              </h3>
              {user.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No documents</p>
              ) : (
                <ul className="max-h-36 space-y-2 overflow-y-auto">
                  {user.documents.slice(0, 8).map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded border border-border/50 px-2 py-1.5 text-xs"
                    >
                      <span className="truncate font-medium">{doc.title}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {doc.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-primary" />
                Recent chats
              </h3>
              {user.conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground">No conversations</p>
              ) : (
                <ul className="max-h-36 space-y-2 overflow-y-auto">
                  {user.conversations.slice(0, 6).map((chat) => (
                    <li
                      key={chat.id}
                      className="rounded border border-border/50 px-2 py-1.5 text-xs"
                    >
                      <p className="font-medium">{chat.documentTitle}</p>
                      {chat.lastMessage && (
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Access audit trail
              </h3>
              {!auditData?.logs?.length ? (
                <p className="text-xs text-muted-foreground">No access events recorded</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {auditData.logs.map((log) => (
                    <li
                      key={log.id}
                      className="rounded border border-border/50 px-2 py-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.question && (
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                          Q: {log.question}
                        </p>
                      )}
                      {log.reason && (
                        <p className="mt-0.5 text-muted-foreground">Note: {log.reason}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              {!user.emailVerified && (
                <Button size="sm" variant="outline" onClick={() => void resendVerify()}>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verify
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Refresh
              </Button>
              {!isSelf ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void deleteUser()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete user & all data
                </Button>
              ) : (
                <p className="w-full text-xs text-muted-foreground">
                  You cannot delete your own admin account from here.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
