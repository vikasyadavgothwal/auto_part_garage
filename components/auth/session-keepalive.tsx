"use client"

import { useEffect } from "react"

import { appPath } from "@/lib/routes"

export function SessionKeepalive() {
  useEffect(() => {
    let lastRefresh = Date.now()

    const refreshIfActive = () => {
      if (document.visibilityState === "hidden") return
      const now = Date.now()
      if (now - lastRefresh < 60_000) return
      lastRefresh = now
      void fetch(appPath("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }).catch(() => undefined)
    }

    window.addEventListener("focus", refreshIfActive)
    document.addEventListener("visibilitychange", refreshIfActive)

    return () => {
      window.removeEventListener("focus", refreshIfActive)
      document.removeEventListener("visibilitychange", refreshIfActive)
    }
  }, [])

  return null
}
