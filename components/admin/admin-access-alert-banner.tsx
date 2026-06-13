"use client"

import Link from "next/link"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { useAdminAccessAlerts } from "@/hooks/use-admin-access-alerts"
import { cn } from "@/lib/utils"

function formatRequestedAt(iso: string | null): string {
  if (!iso) return "recently"
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return "today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export function AdminAccessAlertBanner({ isAdmin }: { isAdmin: boolean }) {
  const { data } = useAdminAccessAlerts(isAdmin)
  const alerts = data?.alerts
  const pending = alerts?.pendingUnblockCount ?? 0

  if (!isAdmin || pending === 0) return null

  const preview = alerts?.pendingUsers.slice(0, 2) ?? []
  const extra = Math.max(0, pending - preview.length)
  const slaOverdue = alerts?.slaOverdueCount ?? 0

  return (
    <div
      role="alert"
      className={`border-b px-4 py-3 md:px-6 ${
        slaOverdue > 0
          ? "border-red-500/40 bg-red-500/10"
          : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              slaOverdue > 0
                ? "bg-red-500/20 text-red-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold ${
                slaOverdue > 0 ? "text-red-100" : "text-amber-100"
              }`}
            >
              {pending} user{pending === 1 ? "" : "s"} waiting for unblock review
              {slaOverdue > 0
                ? ` · ${slaOverdue} past ${alerts?.appealSlaBusinessDays ?? 2}-day SLA`
                : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-200/80">
              {preview.map((u) => `${u.name ?? u.email} (${formatRequestedAt(u.unblockRequestedAt)})`).join(" · ")}
              {extra > 0 ? ` · +${extra} more` : ""}
            </p>
          </div>
        </div>
        <Link
          href="/admin/users?needsAction=1"
          className={cn(
            buttonVariants({ size: "sm" }),
            "shrink-0 bg-amber-500 text-amber-950 hover:bg-amber-400"
          )}
        >
          Review now
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
