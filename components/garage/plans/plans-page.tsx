import { cookies } from "next/headers"

import { Button } from "@/components/ui/button"
import { BillingPrice } from "@/components/garage/plans/billing-price"
import { ChangePlanButton } from "@/components/garage/plans/change-plan-button"
import { requestBackend } from "@/lib/auth/backend"

type BusinessPlan = {
  id: string
  code: "Free" | "Pro" | "Enterprise"
  accountType: "Fleet" | "Garage" | "Supplier"
  name: string
  description: string | null
  price: { amount: number; yearlyAmount: number; currency: string; billingPeriod: string }
  limits: {
    staff: number | null
    roles: number | null
    appointments: number | null
    services: number | null
  }
  reports?: { dashboard: boolean; usage: boolean; activity: boolean }
  support?: { priority: boolean }
  enabledFeatures: string[]
}

type BusinessAccess = {
  businessAccount: {
    id: string
    plan: BusinessPlan
    usage?: {
      staff?: number
      appointments?: number
      services?: number
    }
  }
}

type AccessPayload = { ok: boolean; access?: BusinessAccess[] }
type PlansPayload = { ok: boolean; plans?: BusinessPlan[] }

const limitText = (value: number | null | undefined) => value == null ? "Unlimited" : String(value)
const formatUsage = (used: number | null | undefined, limit: number | null | undefined) => {
  const usedText = used == null ? "0" : String(used)
  return `${usedText}/${limit == null ? "Unlimited" : String(limit)}`
}

const isLimitReached = (
  used: number | null | undefined,
  limit: number | null | undefined,
) => {
  if (limit == null || used == null) return false
  return used >= limit
}

const toNumber = (value: number | undefined) => {
  if (typeof value === "number") return value
  return 0
}

async function readPlanData() {
  const cookieHeader = (await cookies()).toString()
  const [accessResponse, plansResponse] = await Promise.all([
    requestBackend("/api/v1/business/access", { cookieHeader }),
    requestBackend("/api/v1/public/business/plans"),
  ])
  const accessPayload = accessResponse.ok ? ((await accessResponse.json()) as AccessPayload) : { ok: false }
  const plansPayload = plansResponse.ok ? ((await plansResponse.json()) as PlansPayload) : { ok: false }
  return {
    access: accessPayload.access?.find((item) => item.businessAccount.plan.accountType === "Garage"),
    plans: (plansPayload.plans ?? []).filter((plan) => plan.accountType === "Garage"),
  }
}

export async function PlansPage() {
  const { access, plans } = await readPlanData()
  const currentPlan = access?.businessAccount.plan
  const businessAccountId = access?.businessAccount.id
  const usage = access?.businessAccount.usage
  const usageCards = currentPlan ? [
    { label: "Services", value: toNumber(usage?.services), limit: currentPlan.limits.services },
    { label: "Appointments", value: toNumber(usage?.appointments), limit: currentPlan.limits.appointments },
    { label: "Staff", value: toNumber(usage?.staff), limit: currentPlan.limits.staff },
  ] : []
  const reachedLimits = usageCards.filter((item) => isLimitReached(item.value, item.limit))
  const isEnterpriseCurrent = currentPlan?.code === "Enterprise"

  return (
    <div className="space-y-6">
      {currentPlan ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <h2 className="mt-2 text-2xl font-semibold">{currentPlan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{currentPlan.description}</p>
            </div>
            <div className="text-left sm:text-right">
              <BillingPrice code={currentPlan.code} currency={currentPlan.price.currency} monthlyAmount={currentPlan.price.amount} yearlyAmount={currentPlan.price.yearlyAmount} />
              <p className="mt-1 text-xs text-emerald-500">Active subscription</p>
            </div>
          </div>
          {usageCards.length ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {usageCards.map((item) => (
                <p key={item.label} className="text-sm text-muted-foreground">
                  {item.label} used {formatUsage(item.value, item.limit)}
                </p>
              ))}
            </div>
          ) : null}
          {reachedLimits.length ? (
            <p className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-200">
              Usage has reached plan limits for: {reachedLimits.map((item) => item.label).join(", ")}. Upgrade your plan for higher limits.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id
          return (
            <div key={plan.id} className={`rounded-lg border bg-card p-5 shadow-sm ${isCurrent ? "border-primary" : "border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                {isCurrent ? <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">Current</span> : null}
              </div>
              <div className="mt-4">
                <BillingPrice code={plan.code} currency={plan.price.currency} monthlyAmount={plan.price.amount} yearlyAmount={plan.price.yearlyAmount} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Staff</dt><dd>{limitText(plan.limits.staff)}</dd></div>
                <div><dt className="text-muted-foreground">Roles</dt><dd>{limitText(plan.limits.roles)}</dd></div>
                <div><dt className="text-muted-foreground">Services</dt><dd>{limitText(plan.limits.services)}</dd></div>
                <div><dt className="text-muted-foreground">Appointments</dt><dd>{limitText(plan.limits.appointments)}</dd></div>
                <div><dt className="text-muted-foreground">Reports</dt><dd>{plan.reports?.activity ? "Dashboard, usage, activity" : plan.reports?.usage ? "Dashboard and usage" : plan.reports?.dashboard ? "Dashboard" : "Not included"}</dd></div>
              </dl>
              {isEnterpriseCurrent && !isCurrent ? null : isCurrent || !businessAccountId || !currentPlan ? (
                <Button className="mt-5 w-full" variant="secondary" disabled>Current Plan</Button>
              ) : (
                <ChangePlanButton
                  businessAccountId={businessAccountId}
                  currentPlanName={currentPlan.name}
                  planId={plan.id}
                  planName={plan.name}
                  actionLabel={plan.code === "Enterprise" ? "Contact Sales" : "Upgrade Plan"}
                />
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
