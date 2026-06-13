"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  UserX,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications, type AppNotification } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function notificationIcon(type: string) {
  switch (type) {
    case "document_ready":
    case "analysis_complete":
      return CheckCircle2
    case "document_failed":
    case "analysis_failed":
      return XCircle
    case "risk_alert":
      return AlertTriangle
    case "unblock_request":
      return ShieldAlert
    case "user_access_restricted":
      return UserX
    default:
      return FileText
  }
}

function notificationHref(n: AppNotification): string | null {
  if (n.type === "unblock_request" || n.type === "user_access_restricted") {
    return "/admin/users?needsAction=1"
  }

  const docId = n.metadata?.documentId
  if (!docId) return null
  return `/dashboard/documents/${docId}`
}

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications()

  async function handleOpenItem(n: AppNotification) {
    if (!n.read) await markRead([n.id])
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center p-0 text-[10px] font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,22rem)] border-border bg-popover p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary"
              onClick={() => markAllRead()}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = notificationIcon(n.type)
              const href = notificationHref(n)
              const content = (
                <div
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      n.type === "unblock_request" || n.type === "user_access_restricted"
                        ? "bg-amber-500/15 text-amber-400"
                        : n.type === "risk_alert"
                        ? "bg-amber-500/15 text-amber-500"
                        : n.type.includes("failed")
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/15 text-emerald-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              )

              if (href) {
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => handleOpenItem(n)}
                  >
                    {content}
                  </button>
                )
              }

              return (
                <div key={n.id} className="border-b border-border/50 last:border-0">
                  {content}
                </div>
              )
            })
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <Link
              href="/dashboard/documents"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all documents
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
