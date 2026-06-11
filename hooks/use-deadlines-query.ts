"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import type { PaginationMeta } from "@/lib/pagination"
import { queryKeys } from "@/lib/query-keys"
import type { TimelineEvent } from "@/types/analysis"

export const DEADLINES_PAGE_SIZE = 5

type DeadlinesResponse = {
  deadlines: TimelineEvent[]
  pagination: PaginationMeta
}

export function useDeadlinesQuery(page: number) {
  return useQuery({
    queryKey: queryKeys.deadlines.list({
      page,
      limit: DEADLINES_PAGE_SIZE,
    }),
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(DEADLINES_PAGE_SIZE),
      })
      return fetchJson<DeadlinesResponse>(`/api/deadlines?${qs}`)
    },
    placeholderData: (prev) => prev,
  })
}
