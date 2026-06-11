"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"

export type WeeklyActivityPoint = {
  day: string
  uploads: number
  queries: number
}

export type TypeDistributionPoint = {
  name: string
  value: number
  count: number
  color: string
}

type ChartsResponse = {
  weeklyActivity: WeeklyActivityPoint[]
  typeDistribution: TypeDistributionPoint[]
}

export function useChartsQuery() {
  return useQuery({
    queryKey: queryKeys.charts(),
    queryFn: () => fetchJson<ChartsResponse>("/api/charts"),
  })
}
