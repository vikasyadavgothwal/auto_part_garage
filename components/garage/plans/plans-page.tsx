import { cookies } from "next/headers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BillingPrice } from "@/components/garage/plans/billing-price"
import { ChangePlanButton } from "@/components/garage/plans/change-plan-button"
import { requestBackend } from "@/lib/auth/backend"

type BusinessPlan = {
  id: string
  code: "Free" | "Pro" | "Enterprise"
  accountType: "Fleet" | "Garage" | "Supplier"
  name: string
  description: string | null
  price: { amount: number; yearlyAmount: number; currency: string; billingPeriod: string; monthlyBillingDays?: number }
  securityTier?: string
  supportTier?: string
  loginSecurityMode?: string
  reportLevel?: "dashboard" | "standard" | "premium"
  limits: { staff: number | null; roles: number | null; appointments: number | null; services: number | null }
  reports?: { dashboard: boolean; usage: boolean; activity: boolean }
  support?: { priority: boolean }
  enabledFeatures: string[]
}

type BusinessAccess = {
  businessAccount: {
    id: string
    type?: string
    createdAt?: string | null
    updatedAt?: string | null
    plan: BusinessPlan
    subscription?: { activatedAt?: string | null; endsAt?: string | null }
    usage?: { staff?: number; appointments?: number; services?: number }
  }
  activeAddOns?: ActiveAddOn[]
  entitlements?: { subscription?: { activatedAt?: string | null; endsAt?: string | null }; activeAddOns?: ActiveAddOn[] }
}
type ActiveAddOn = { id: string; label: string; featureKey: string; status: string; validFrom?: string | null; validUntil?: string | null; renewalAt?: string | null }

type AccessPayload = { ok: boolean; access?: BusinessAccess[] }
type PlansPayload = { ok: boolean; plans?: BusinessPlan[] }

const limitText = (value: number | null | undefined) => value == null ? "Unlimited" : String(value)
const reportText = (plan: BusinessPlan) => plan.reportLevel === "premium" ? "Premium analytics" : plan.reportLevel === "standard" ? "Dashboard, usage, activity" : plan.reports?.activity ? "Dashboard, usage, activity" : plan.reports?.usage ? "Dashboard and usage" : "Dashboard"
const securityText = (plan: BusinessPlan) => plan.securityTier ? `${plan.securityTier} (${plan.loginSecurityMode === "otp" ? "OTP" : "Password"})` : plan.code === "Enterprise" ? "Premium (OTP)" : plan.code === "Pro" ? "Standard (OTP)" : "Basic (Password)"
const supportText = (plan: BusinessPlan) => plan.supportTier ?? (plan.support?.priority ? "Premium" : plan.code === "Pro" ? "Standard" : "Basic")
const isLimitReached = (used: number | null | undefined, limit: number | null | undefined) => limit != null && used != null && used >= limit
const toNumber = (value: number | undefined) => typeof value === "number" ? value : 0
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC", year: "numeric" })

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not set"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not set"
  return dateFormatter.format(date)
}
const isSamePlan = (plan: BusinessPlan, currentPlan: BusinessPlan | undefined) =>
  Boolean(currentPlan && ((plan.id && currentPlan.id && plan.id === currentPlan.id) || (plan.code === currentPlan.code && plan.accountType === currentPlan.accountType)))
const isGarageAccess = (item: BusinessAccess) =>
  item.businessAccount.type === "Garage" || item.businessAccount.plan.accountType === "Garage"

async function readPlanData() {
  const cookieHeader = (await cookies()).toString()
  const [accessResponse, plansResponse] = await Promise.all([requestBackend("/api/v1/business/access", { cookieHeader }), requestBackend("/api/v1/public/business/plans")])
  const accessPayload = accessResponse.ok ? ((await accessResponse.json()) as AccessPayload) : { ok: false }
  const plansPayload = plansResponse.ok ? ((await plansResponse.json()) as PlansPayload) : { ok: false }
  return { access: accessPayload.access?.find(isGarageAccess), plans: (plansPayload.plans ?? []).filter((plan) => plan.accountType === "Garage") }
}

export async function PlansPage() {
  const { access, plans } = await readPlanData()
  const currentPlan = access?.businessAccount.plan
  const usage = access?.businessAccount.usage
  const activeAddOns = access?.activeAddOns ?? access?.entitlements?.activeAddOns ?? []
  const usageCards = currentPlan ? [{ label: "Services", value: toNumber(usage?.services), limit: currentPlan.limits.services }, { label: "Appointments", value: toNumber(usage?.appointments), limit: currentPlan.limits.appointments }, { label: "Staff", value: toNumber(usage?.staff), limit: currentPlan.limits.staff }] : []
  const reachedLimits = usageCards.filter((item) => isLimitReached(item.value, item.limit))

  return <div className="space-y-6">
    {currentPlan ? <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Current plan</p><h2 className="mt-2 text-2xl font-semibold">{currentPlan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{currentPlan.description}</p></div>{currentPlan.code !== "Free" ? <div className="text-left sm:text-right"><BillingPrice code={currentPlan.code} currency={currentPlan.price.currency} monthlyAmount={currentPlan.price.amount} yearlyAmount={currentPlan.price.yearlyAmount} /><p className="mt-1 text-xs text-emerald-500">Active subscription</p></div> : null}</div>
      
      {reachedLimits.length ? <p className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-200">Usage has reached plan limits for: {reachedLimits.map((item) => item.label).join(", ")}. Ask admin for a higher plan.</p> : null}
    </section> : null}
    <Card>
      <CardHeader>
        <CardTitle>Active add-ons</CardTitle>
        <CardDescription>Permissions enabled by admin for this Garage account, with expiry and renewal dates.</CardDescription>
      </CardHeader>
      <CardContent>
        {activeAddOns.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {activeAddOns.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.featureKey}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500">{item.status}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div><dt className="text-muted-foreground">Valid from</dt><dd className="mt-1 font-medium">{formatDate(item.validFrom)}</dd></div>
                  <div><dt className="text-muted-foreground">Expires</dt><dd className="mt-1 font-medium">{formatDate(item.validUntil)}</dd></div>
                  <div><dt className="text-muted-foreground">Renewal</dt><dd className="mt-1 font-medium">{formatDate(item.renewalAt)}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        ) : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">No active add-ons for this account.</p>}
      </CardContent>
    </Card>
    <section className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => { const isCurrent = isSamePlan(plan, currentPlan); return <div key={plan.id} className={`rounded-lg border bg-card p-5 shadow-sm ${isCurrent ? "border-primary" : "border-border"}`}><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{plan.description}</p></div>{isCurrent ? <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">Current</span> : null}</div>{plan.code !== "Free" ? <div className="mt-4"><BillingPrice code={plan.code} currency={plan.price.currency} monthlyAmount={plan.price.amount} yearlyAmount={plan.price.yearlyAmount} /></div> : null}<dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Staff</dt><dd>{limitText(plan.limits.staff)}</dd></div><div><dt className="text-muted-foreground">Roles</dt><dd>{limitText(plan.limits.roles)}</dd></div><div><dt className="text-muted-foreground">Services</dt><dd>{limitText(plan.limits.services)}</dd></div><div><dt className="text-muted-foreground">Appointments</dt><dd>{limitText(plan.limits.appointments)}</dd></div><div><dt className="text-muted-foreground">Reports</dt><dd>{reportText(plan)}</dd></div><div><dt className="text-muted-foreground">Security</dt><dd>{securityText(plan)}</dd></div><div><dt className="text-muted-foreground">Support</dt><dd>{supportText(plan)}</dd></div>{plan.code !== "Free" ? <div><dt className="text-muted-foreground">Monthly days</dt><dd>{plan.price.monthlyBillingDays ?? 30}</dd></div> : null}</dl>{isCurrent ? <Button className="mt-5 w-full" variant="secondary" disabled>Current Plan</Button> : currentPlan && access ? <ChangePlanButton businessAccountId={access.businessAccount.id} currentPlanName={currentPlan.name} planId={plan.id} planName={plan.name} actionLabel={plan.code === "Free" ? "Downgrade Plan" : currentPlan.code === "Free" ? "Upgrade Plan" : "Change Plan"} /> : <Button className="mt-5 w-full" variant="secondary" disabled>Plan unavailable</Button>}</div> })}</section>
  </div>
}
