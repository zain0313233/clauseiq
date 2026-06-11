"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authHeaders } from "@/lib/auth-client"
import { fetchJson } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import { invalidateTemplates } from "@/hooks/query-utils"
import type { StandardTemplate } from "@/types/comparison"

type TemplatesResponse = {
  templates: StandardTemplate[]
}

export function useTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.templates(),
    queryFn: () => fetchJson<TemplatesResponse>("/api/templates"),
    select: (data) => data.templates ?? [],
  })
}

export function useUploadTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      return data
    },
    onSuccess: () => invalidateTemplates(queryClient),
  })
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      return data
    },
    onSuccess: () => invalidateTemplates(queryClient),
  })
}
