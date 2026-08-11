"use client"

import { useCallback, useEffect } from "react"

import {
  notificationFetch,
  notificationsApiPath,
  notificationsStreamPath,
} from "@/lib/notifications/client"

type NotificationsPayload = {
  ok?: boolean
  unreadCount?: number
}

export function NotificationLiveListener({
  onUnreadChange,
}: {
  onUnreadChange: (count: number) => void
}) {
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationFetch(notificationsApiPath)
      const payload = (await response.json()) as NotificationsPayload
      if (payload.ok && typeof payload.unreadCount === "number") {
        onUnreadChange(payload.unreadCount)
      }
    } catch {}
  }, [onUnreadChange])

  useEffect(() => {
    let source: EventSource | null = null

    const unreadTimer = window.setTimeout(() => {
      void loadUnreadCount()
    }, 1_500)

    const applyPayload = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as NotificationsPayload
        if (typeof payload.unreadCount === "number") {
          onUnreadChange(payload.unreadCount)
        }
      } catch {}
    }

    const startStream = () => {
      if (source || document.visibilityState === "hidden") return
      source = new EventSource(notificationsStreamPath, {
        withCredentials: true,
      })
      source.addEventListener("snapshot", applyPayload)
      source.addEventListener("notification", applyPayload)
    }

    const streamTimer = window.setTimeout(startStream, 5_000)
    document.addEventListener("visibilitychange", startStream)

    return () => {
      window.clearTimeout(unreadTimer)
      window.clearTimeout(streamTimer)
      document.removeEventListener("visibilitychange", startStream)
      source?.close()
    }
  }, [loadUnreadCount, onUnreadChange])

  return null
}
