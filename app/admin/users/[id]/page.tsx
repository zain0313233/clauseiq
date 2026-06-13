"use client"

import { use } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { fetchJson } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type UserDetail = {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: boolean
  emailVerifiedAt: string | null
  createdAt: string
  counts: {
    documents: number
    conversations: number
    messages: number
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

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchJson<{ user: UserDetail }>(`/api/platform/users/${id}`),
  })

  const user = data?.user

  async function resendVerify() {
    try {
      const res = await fetch("/api/platform/access/resend-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
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
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account")
      return
    }
    if (
      !confirm(
        `Delete ${user.email}? This permanently removes all documents, chats, messages, Pinecone vectors, and files.`
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/platform/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Delete failed")
      toast.success("User and all data deleted")
      window.location.href = "/admin/users"
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <p className="text-destructive">
        {error instanceof Error ? error.message : "User not found"}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/users"
          className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{user.name ?? "Unnamed user"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{user.role}</Badge>
            <Badge variant="outline">
              {user.emailVerified ? "verified" : "unverified"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!user.emailVerified && (
            <Button size="sm" variant="outline" onClick={() => void resendVerify()}>
              <Mail className="mr-2 h-4 w-4" />
              Resend verify email
            </Button>
          )}
          {user.id !== currentUser?.id ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void deleteUser()}
            >
              Delete user & all data
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              You cannot delete your own account.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Documents", user.counts.documents],
          ["Conversations", user.counts.conversations],
          ["Messages", user.counts.messages],
          ["Notifications", user.counts.notifications],
          ["Templates", user.counts.templates],
        ].map(([label, value]) => (
          <Card key={label as string} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{value as number}</p>
              <p className="text-xs text-muted-foreground">{label as string}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents</p>
          ) : (
            user.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {doc.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user.conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations</p>
          ) : (
            user.conversations.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border/50 px-3 py-2"
              >
                <p className="text-sm font-medium">{c.documentTitle}</p>
                {c.lastMessage && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {c.lastMessage.content}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Joined {new Date(user.createdAt).toLocaleString()}
        {user.emailVerifiedAt &&
          ` · Verified ${new Date(user.emailVerifiedAt).toLocaleString()}`}
      </p>
    </div>
  )
}
