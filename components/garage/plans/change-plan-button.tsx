"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function ChangePlanButton({
  businessAccountId,
  currentPlanName,
  planId,
  planName,
  actionLabel,
}: {
  businessAccountId: string
  currentPlanName: string
  planId: string
  planName: string
  actionLabel: string
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const changePlan = async () => {
    if (!window.confirm(`Change plan from ${currentPlanName} to ${planName}?`)) return
    setSaving(true)
    const response = await fetch("/api/plans/change", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessAccountId, planId }),
    })
    const result = (await response.json().catch(() => null)) as { message?: string } | null
    setSaving(false)
    if (!response.ok) {
      window.alert(result?.message ?? "Unable to change plan.")
      return
    }
    router.refresh()
  }

  return (
    <Button className="mt-5 w-full" onClick={changePlan} disabled={saving}>
      {saving ? "Updating..." : actionLabel}
    </Button>
  )
}
