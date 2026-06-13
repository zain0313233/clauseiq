"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"

export type AdminAccessAlertUser = {
  id: string
  name: string | null
  email: string
  accessRestricted: boolean
  unblockRequestedAt: string | null
}

export type AdminAccessAlerts = {
  pendingUnblockCount: number
  restrictedCount: number
  needsActionCount: number
  slaOverdueCount: number
  securityBlockedDocuments: number
  appealSlaBusinessDays: number
  pendingUsers: AdminAccessAlertUser[]
}

export function useAdminAccessAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "access-alerts"],
    queryFn: () =>
      fetchJson<{ alerts: AdminAccessAlerts }>("/api/platform/access-alerts"),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}
