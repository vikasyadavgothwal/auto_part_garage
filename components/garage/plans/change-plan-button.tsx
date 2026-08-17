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
}: {
  businessAccountId: string
  currentPlanName: string
  planId: string
  planName: string
  actionLabel: string
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
    const result = (await response.json().catch(() => null)) as { message?: string } | null
    setSaving(false)
    if (!response.ok) {
      toast.error(result?.message ?? "Unable to change plan.")
      return
    }
    setIsDialogOpen(false)
    toast.success(`Plan changed to ${planName}.`)
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
            <DialogTitle>Change plan</DialogTitle>
            <DialogDescription>Change plan from {currentPlanName} to {planName}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={() => void changePlan()} disabled={saving}>
              {saving ? "Updating..." : "Confirm change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
