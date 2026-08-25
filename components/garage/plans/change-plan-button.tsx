"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { appPath } from "@/lib/routes"

export function ChangePlanButton({
  businessAccountId,
  currentPlanName,
  planId,
  planName,
  currency,
  monthlyAmount,
  yearlyAmount,
  actionLabel,
  isDowngrade,
}: {
  businessAccountId: string
  currentPlanName: string
  planId: string
  planName: string
  currency: string
  monthlyAmount: number
  yearlyAmount: number
  actionLabel: string
  isDowngrade: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [autoRenewConsent, setAutoRenewConsent] = useState(false)
  const canUseAnnualBilling = !isDowngrade && yearlyAmount > 0
  const annualChargeAmount = yearlyAmount * 12
  const renewalAmount = billingCycle === "yearly" ? annualChargeAmount : monthlyAmount
  const renewalLabel = billingCycle === "yearly" ? "year" : "month"
  const canConfirm = !saving

  const changePlan = async () => {
    if (!canConfirm) return
    setSaving(true)
    const response = await fetch(appPath("/api/plans/change"), {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": `garage-plan-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      },
      body: JSON.stringify({
        businessAccountId,
        planId,
        billingCycle,
        autoRenewConsent: !isDowngrade && autoRenewConsent,
        paymentSuccessUrl: `${window.location.origin}${appPath("/plans")}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        paymentCancelUrl: `${window.location.origin}${appPath("/plans")}?payment=cancelled`,
      }),
    })
    const result = (await response.json().catch(() => null)) as {
      message?: string
      change?: { status?: string; effectiveAt?: string }
      payment?: { checkoutUrl?: string | null; stripeConfigured?: boolean }
    } | null
    setSaving(false)
    if (!response.ok) {
      toast.error(result?.message ?? "Unable to change plan.")
      return
    }
    setIsDialogOpen(false)
    if (result?.payment?.checkoutUrl) {
      window.location.assign(result.payment.checkoutUrl)
      return
    }
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
            <DialogTitle>{isDowngrade ? "Downgrade plan" : "Upgrade plan"}</DialogTitle>
            <DialogDescription>
              {isDowngrade
                ? `Pay now to downgrade from ${currentPlanName} to ${planName}.`
                : `${planName} activates immediately and replaces ${currentPlanName}.`}
            </DialogDescription>
          </DialogHeader>
          {!isDowngrade ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setBillingCycle("monthly"); setAutoRenewConsent(false) }}
                  className={`rounded-lg border p-3 text-left text-sm transition ${billingCycle === "monthly" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <span className="font-medium">Monthly billing</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{currency} {(monthlyAmount / 100).toLocaleString("en-US")} every month</span>
                </button>
                <button
                  type="button"
                  disabled={!canUseAnnualBilling}
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-lg border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${billingCycle === "yearly" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                >
                  <span className="font-medium">Annual billing</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{currency} {(annualChargeAmount / 100).toLocaleString("en-US")}/year</span>
                </button>
              </div>
              <label className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <Checkbox checked={autoRenewConsent} onCheckedChange={(checked) => setAutoRenewConsent(checked === true)} disabled={saving} />
                <span>
                  <span className="font-medium">Enable auto-renew</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {autoRenewConsent
                      ? `AutoParts Pro may charge my saved Stripe payment method ${currency} ${(renewalAmount / 100).toLocaleString("en-US")} every ${renewalLabel} until I cancel.`
                      : `Pay ${currency} ${(renewalAmount / 100).toLocaleString("en-US")} once for this ${renewalLabel}. It will not renew automatically.`}
                  </span>
                </span>
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={() => void changePlan()} disabled={!canConfirm}>
              {saving ? "Updating..." : isDowngrade ? "Pay and downgrade" : "Confirm upgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
