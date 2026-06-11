"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import type { PortfolioFilter } from "@/lib/document-filters"
import type { PaginationMeta } from "@/lib/pagination"
import { queryKeys, type DocumentListStatus } from "@/lib/query-keys"

export const DOCUMENTS_PAGE_SIZE = 10
export const RECENT_DOCUMENTS_LIMIT = 5

export type DocumentSummary = {
  total: number
  ready: number
  processing: number
  failed: number
  portfolio: {
    expiring: number
    highRisk: number
    unlimited: number
  }
}

export type DocumentsListResponse = {
  documents: unknown[]
  pagination: PaginationMeta
  summary: DocumentSummary
}

type UseDocumentsQueryParams = {
  page: number
  limit?: number
  search: string
  status: DocumentListStatus
  portfolio: PortfolioFilter
  enabled?: boolean
}

async function fetchDocumentsPage(
  params: UseDocumentsQueryParams & { limit: number }
): Promise<DocumentsListResponse> {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search,
    status: params.status,
    portfolio: params.portfolio,
  })

  return fetchJson<DocumentsListResponse>(`/api/documents?${qs}`)
}

export function useDocumentsQuery(params: UseDocumentsQueryParams) {
  const limit = params.limit ?? DOCUMENTS_PAGE_SIZE

  return useQuery({
    queryKey: queryKeys.documents.list({
      page: params.page,
      limit,
      search: params.search,
      status: params.status,
      portfolio: params.portfolio,
    }),
    queryFn: () => fetchDocumentsPage({ ...params, limit }),
    enabled: params.enabled ?? true,
    placeholderData: (prev) => prev,
  })
}
