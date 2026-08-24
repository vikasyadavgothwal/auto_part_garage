"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function PlanReturnToast({ title, body }: { title: string; body: string }) {
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    shown.current = true
    toast.success(title, { description: body })
  }, [body, title])

  return null
}
