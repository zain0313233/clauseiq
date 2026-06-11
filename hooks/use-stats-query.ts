"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export type DashboardStats = {
  total: number
  ready: number
  queries: number
  risky: number
}

type StatsResponse = {
  stats: DashboardStats
}

export function useStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: () => fetchJson<StatsResponse>("/api/stats"),
    select: (data) => data.stats,
  })
}
