"use client"

import { useEffect, useRef } from "react"
import { authHeaders } from "@/lib/auth-client"

type DocumentLike = { id: string; status: string }

const POLL_INTERVAL_MS = 5000

export function useDocumentPolling<T extends DocumentLike>(
  documents: T[],
  onRefresh: () => void | Promise<void>,
  enabled = true
) {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const hasProcessing = documents.some(
    (d) => d.status === "processing" || d.status === "pending"
  )

  useEffect(() => {
    if (!enabled || !hasProcessing) return

    const id = setInterval(() => {
      onRefreshRef.current()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [enabled, hasProcessing])
}

/** Poll a single document status until ready or failed */
export function useSingleDocumentPolling(
  documentId: string | null,
  currentStatus: string | undefined,
  onStatusChange: (status: string) => void
) {
  useEffect(() => {
    if (
      !documentId ||
      !currentStatus ||
      (currentStatus !== "processing" && currentStatus !== "pending")
    ) {
      return
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          headers: authHeaders(),
        })
        const data = await res.json()
        if (res.ok && data.document?.status) {
          onStatusChange(data.document.status)
        }
      } catch {
        // ignore transient errors
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [documentId, currentStatus, onStatusChange])
}
