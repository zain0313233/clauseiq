"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ChatDocument } from "@/components/chat/types"

type AllDocumentsResponse = {
  documents: ChatDocument[]
}

export function useAllDocumentsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.documents.all(),
    queryFn: () => fetchJson<AllDocumentsResponse>("/api/documents"),
    select: (data) => data.documents ?? [],
    enabled,
    placeholderData: (prev) => prev,
  })
}
