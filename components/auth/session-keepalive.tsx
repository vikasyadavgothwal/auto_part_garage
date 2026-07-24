"use client"

import { useEffect } from "react"

import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

export function SessionKeepalive() {
  useEffect(() => {
    let lastRefresh = 0

    const refreshIfActive = () => {
      if (document.visibilityState === "hidden") return
      const now = Date.now()
      if (now - lastRefresh < 60_000) return
      lastRefresh = now
      void authenticatedFetch(appPath("/api/auth/refresh"), {
        method: "POST",
        cache: "no-store",
      })
    }

    refreshIfActive()
    window.addEventListener("focus", refreshIfActive)
    document.addEventListener("visibilitychange", refreshIfActive)

    return () => {
      window.removeEventListener("focus", refreshIfActive)
      document.removeEventListener("visibilitychange", refreshIfActive)
    }
  }, [])

  return null
}
