"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ChangePlanButton({
  businessAccountId,
  currentPlanName,
  planId,
  planName,
  actionLabel,
  isDowngrade,
}: {
  businessAccountId: string
  currentPlanName: string
  planId: string
  planName: string
  actionLabel: string
  isDowngrade: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const changePlan = async () => {
    setSaving(true)
    const response = await fetch("/api/plans/change", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessAccountId, planId }),
    })
    const result = (await response.json().catch(() => null)) as {
      message?: string
      change?: { status?: string; effectiveAt?: string }
    } | null
    setSaving(false)
    if (!response.ok) {
      toast.error(result?.message ?? "Unable to change plan.")
      return
    }
    setIsDialogOpen(false)
    if (result?.change?.status === "scheduled") {
      const date = result.change.effectiveAt
        ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(result.change.effectiveAt))
        : "the end of your current billing period"
      toast.success(`Downgrade scheduled. ${planName} activates on ${date}.`)
    } else {
      toast.success(`${planName} is active now.`)
    }
    router.refresh()
  }

  return (
    <>
      <Button className="mt-5 w-full" onClick={() => setIsDialogOpen(true)} disabled={saving}>
        {saving ? "Updating..." : actionLabel}
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isDowngrade ? "Schedule downgrade" : "Upgrade plan"}</DialogTitle>
            <DialogDescription>
              {isDowngrade
                ? `${currentPlanName} remains active until its current billing period ends. ${planName} activates automatically after that.`
                : `${planName} activates immediately and replaces ${currentPlanName}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={() => void changePlan()} disabled={saving}>
              {saving ? "Updating..." : isDowngrade ? "Schedule downgrade" : "Confirm upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
