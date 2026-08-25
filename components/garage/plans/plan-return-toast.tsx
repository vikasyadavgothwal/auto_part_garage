"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function PlanReturnToast({ title, body, type }: { title: string; body: string; type: "success" | "error" }) {
  const router = useRouter()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    shown.current = true
    const notify = type === "success" ? toast.success : toast.error
    notify(title, { description: body })
    if (type === "success") router.refresh()
  }, [body, router, title, type])

  return null
}
