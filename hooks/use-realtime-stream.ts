"use client"

import { useEffect, useRef, useState } from "react"
import type { AppNotification } from "@/hooks/use-notifications"

type RealtimeHandlers = {
  onNotification?: (notification: AppNotification) => void
  onDocumentStatus?: (payload: {
    documentId: string
    title: string
    status: string
    previousStatus: string
  }) => void
  onAnalysisStatus?: (payload: {
    documentId: string
    title: string
    status: string
    riskLevel: string | null
    previousStatus: string
  }) => void
}

export function useRealtimeStream(enabled: boolean, handlers: RealtimeHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let es: EventSource | null = null
    let retryMs = 2_000
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      es = new EventSource("/api/events", { withCredentials: true })

      es.addEventListener("connected", () => {
        setConnected(true)
        retryMs = 2_000
      })

      es.addEventListener("notification", (e) => {
        try {
          const data = JSON.parse(e.data) as AppNotification
          handlersRef.current.onNotification?.(data)
        } catch {
          // ignore malformed events
        }
      })

      es.addEventListener("document.status", (e) => {
        try {
          handlersRef.current.onDocumentStatus?.(JSON.parse(e.data))
        } catch {
          // ignore
        }
      })

      es.addEventListener("analysis.status", (e) => {
        try {
          handlersRef.current.onAnalysisStatus?.(JSON.parse(e.data))
        } catch {
          // ignore
        }
      })

      es.onerror = () => {
        setConnected(false)
        es?.close()
        es = null
        retryTimer = setTimeout(connect, retryMs)
        retryMs = Math.min(retryMs * 1.5, 30_000)
      }
    }

    connect()

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      es?.close()
      setConnected(false)
    }
  }, [enabled])

  return { connected }
}

export function useRealtimeDocumentRefresh(
  enabled: boolean,
  onRefresh: () => void | Promise<void>
) {
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useRealtimeStream(enabled, {
    onDocumentStatus: () => {
      void onRefreshRef.current()
    },
    onAnalysisStatus: () => {
      void onRefreshRef.current()
    },
  })
}
