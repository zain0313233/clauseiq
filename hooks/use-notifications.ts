"use client"

import { useCallback, useEffect, useState } from "react"
import { useRealtimeStream } from "@/hooks/use-realtime-stream"

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  metadata: { documentId?: string } | null
  createdAt: string
}

const FALLBACK_POLL_MS = 60_000

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", {
        credentials: "include",
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        notifications: AppNotification[]
        unreadCount: number
      }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false)
    }
  }, [])

  const prependNotification = useCallback((notification: AppNotification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev
      return [notification, ...prev].slice(0, 20)
    })
    if (!notification.read) {
      setUnreadCount((c) => c + 1)
    }
  }, [])

  useRealtimeStream(enabled, {
    onNotification: prependNotification,
  })

  useEffect(() => {
    if (!enabled) return
    refresh()
    const id = setInterval(refresh, FALLBACK_POLL_MS)
    return () => clearInterval(id)
  }, [enabled, refresh])

  const markRead = useCallback(async (ids: string[]) => {
    const res = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { unreadCount: number }
    setUnreadCount(data.unreadCount)
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    )
  }, [])

  const markAllRead = useCallback(async () => {
    const res = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ all: true }),
    })
    if (!res.ok) return
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  }
}
