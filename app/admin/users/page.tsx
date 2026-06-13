"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Search, Trash2, BarChart3, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { fetchJson } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AdminUserAnalyticsSheet } from "@/components/admin/admin-user-analytics-sheet"
import type { PaginationMeta } from "@/lib/pagination"

type AdminUser = {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: boolean
  accessRestricted: boolean
  unblockRequestPending: boolean
  unblockRequestedAt: string | null
  irrelevantCount: number
  documentCount: number
  conversationCount: number
  createdAt: string
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [needsActionFilter, setNeedsActionFilter] = useState(
    searchParams.get("needsAction") === "1"
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [unblockTarget, setUnblockTarget] = useState<AdminUser | null>(null)
  const [unblockNote, setUnblockNote] = useState("")
  const [analyticsUserId, setAnalyticsUserId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    setNeedsActionFilter(searchParams.get("needsAction") === "1")
  }, [searchParams])

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search, roleFilter, needsActionFilter],
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search ? { search } : {}),
        ...(roleFilter !== "all" ? { role: roleFilter } : {}),
        ...(needsActionFilter ? { needsAction: "1" } : {}),
      })
      return fetchJson<{ users: AdminUser[]; pagination: PaginationMeta }>(
        `/api/platform/users?${qs}`
      )
    },
  })

  function openAnalytics(userId: string) {
    setAnalyticsUserId(userId)
    setSheetOpen(true)
  }

  async function handleUnblock(user: AdminUser, note: string) {
    setUnblockingId(user.id)
    try {
      const res = await fetch("/api/platform/access/unblock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, note }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Unblock failed")
      toast.success(`Access restored for ${user.email}`)
      setUnblockTarget(null)
      setUnblockNote("")
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "access-alerts"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unblock failed")
    } finally {
      setUnblockingId(null)
    }
  }

  async function handleDelete(user: AdminUser) {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account")
      return
    }

    if (
      !confirm(
        `Delete ${user.email}? This permanently removes all their documents, chats, messages, Pinecone vectors, and files.`
      )
    ) {
      return
    }

    setDeletingId(user.id)
    try {
      const res = await fetch(`/api/platform/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Delete failed")
      toast.success("User and all data deleted")
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRoleChange(user: AdminUser, role: "user" | "admin") {
    if (user.id === currentUser?.id && role === "user") {
      toast.error("You cannot demote your own admin account here")
      return
    }

    try {
      const res = await fetch(`/api/platform/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Update failed")
      toast.success(`Role updated to ${role}`)
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a user to see full analytics. Deleting a user removes all their
          data including Pinecone vectors and chat history.
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
              placeholder="Search name or email…"
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
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>
        <Button
          type="button"
          size="sm"
          variant={needsActionFilter ? "default" : "outline"}
          className={needsActionFilter ? "bg-amber-500 text-amber-950 hover:bg-amber-400" : ""}
          onClick={() => {
            setNeedsActionFilter((v) => !v)
            setPage(1)
          }}
        >
          <AlertTriangle className="mr-1.5 h-4 w-4" />
          Needs action
        </Button>
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
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Docs</th>
                    <th className="px-4 py-3 font-medium">Chats</th>
                    <th className="px-4 py-3 font-medium">Access</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id
                    return (
                      <tr
                        key={user.id}
                        className={
                          user.unblockRequestPending
                            ? "border-b border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                            : "border-b border-border/50 hover:bg-muted/20"
                        }
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openAnalytics(user.id)}
                            className="text-left font-medium hover:text-primary"
                          >
                            {user.name ?? "—"}
                            {isSelf && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] text-primary"
                              >
                                you
                              </Badge>
                            )}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                          {!user.emailVerified && (
                            <Badge
                              variant="outline"
                              className="mt-1 text-[10px] text-amber-400"
                            >
                              unverified
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="rounded border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                            value={user.role}
                            disabled={isSelf && user.role === "admin"}
                            onChange={(e) =>
                              void handleRoleChange(
                                user,
                                e.target.value as "user" | "admin"
                              )
                            }
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">{user.documentCount}</td>
                        <td className="px-4 py-3">{user.conversationCount}</td>
                        <td className="px-4 py-3 text-xs">
                          {user.accessRestricted ? (
                            <div className="space-y-1">
                              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                                restricted
                              </Badge>
                              {user.unblockRequestPending && (
                                <p className="text-[10px] font-medium text-amber-400">
                                  unblock requested
                                  {user.unblockRequestedAt
                                    ? ` · ${new Date(user.unblockRequestedAt).toLocaleDateString()}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">active</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAnalytics(user.id)}
                            >
                              <BarChart3 className="mr-1 h-4 w-4" />
                              Analytics
                            </Button>
                            {!isSelf && user.accessRestricted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                                disabled={unblockingId === user.id}
                                onClick={() => {
                                  setUnblockTarget(user)
                                  setUnblockNote("")
                                }}
                              >
                                {unblockingId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Unblock"
                                )}
                              </Button>
                            ) : null}
                            {!isSelf ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === user.id}
                                onClick={() => void handleDelete(user)}
                                title="Delete user and all data"
                              >
                                {deletingId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <span
                                className="inline-flex h-8 items-center px-2 text-[10px] text-muted-foreground"
                                title="Cannot delete your own account"
                              >
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
            users)
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

      <AdminUserAnalyticsSheet
        userId={analyticsUserId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentUserId={currentUser?.id}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
          void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
        }}
      />

      {unblockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Restore access</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Unblock {unblockTarget.email}. A reason is recorded in the audit log.
            </p>
            <textarea
              className="mt-4 min-h-[88px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Reason for restoring access (required)"
              value={unblockNote}
              onChange={(e) => setUnblockNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUnblockTarget(null)
                  setUnblockNote("")
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  unblockingId === unblockTarget.id || unblockNote.trim().length < 3
                }
                onClick={() => void handleUnblock(unblockTarget, unblockNote.trim())}
              >
                {unblockingId === unblockTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm unblock"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
