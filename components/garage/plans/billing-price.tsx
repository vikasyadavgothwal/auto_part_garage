"use client"

import { useState } from "react"

const billingCycles = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Annual" },
] as const

export function BillingPrice({
  code,
  currency,
  monthlyAmount,
  yearlyAmount,
}: {
  code: "Free" | "Pro" | "Enterprise"
  currency: string
  monthlyAmount: number
  yearlyAmount: number
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly")
  const amount = cycle === "monthly" ? monthlyAmount : yearlyAmount
  const helper = cycle === "monthly" ? "Monthly billing" : "Annual autopay discounted monthly rate"

  if (code === "Free") {
    return (
      <div>
        <p className="text-xl font-semibold">Free</p>
        <p className="mt-1 text-xs text-muted-foreground">Included starter access</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 inline-flex rounded-md border border-border bg-background p-1 text-xs shadow-sm">
        {billingCycles.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={cycle === item.value}
            onClick={() => setCycle(item.value)}
            className={`rounded px-3 py-1 font-medium transition ${cycle === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-xl font-semibold">
        {amount === 0 ? "Custom pricing" : `${currency} ${(amount / 100).toLocaleString("en-US")}/month`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}
