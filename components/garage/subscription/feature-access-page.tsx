"use client"

import { useEffect, useMemo, useState } from "react"
import { appPath, appRoutes } from "@/lib/routes"

type FeatureArea = "integrations" | "security" | "support"

export type BusinessAccess = {
  businessAccount: {
    id: string
    type: string
    name: string
    plan: { name: string }
    limits?: { integrations?: number | null }
    usage?: { integrations?: number }
  }
  enabledFeatures?: string[]
  requestableFeatures?: Array<{ key: string; label: string }>
  actions?: Record<string, { allowed: boolean; reason?: string | null }>
}

type AddOnRequest = { id: string; featureKey: string; label: string; status: string }
type SupportTicket = { id: string; subject: string; status: string; priority: string }
type AuditLog = { id: string; action: string; actor?: { name?: string | null; email?: string | null } | null }

const featureConfig = {
  integrations: {
    title: "Integrations",
    subtitle: "Connect service operations, accounting, payments, logistics, and notification tools allowed by the current plan.",
    features: [
      { key: "integrations.manage", label: "External system connections" },
      { key: "api.standard", label: "Standard API access" },
      { key: "api.enterprise", label: "Enterprise API access" },
      { key: "approval-workflows.manage", label: "Approval workflow automation" },
    ],
  },
  security: {
    title: "Security",
    subtitle: "Review workshop staff access, permission depth, audit visibility, and account activity.",
    features: [
      { key: "roles.manage", label: "Custom roles" },
      { key: "permissions.manage", label: "Custom permissions" },
      { key: "reports.activity", label: "Activity audit reports" },
      { key: "approval-workflows.manage", label: "Approval controls" },
    ],
  },
  support: {
    title: "Support",
    subtitle: "Create support tickets and review plan-based priority.",
    features: [
      { key: "support.priority", label: "Priority support" },
      { key: "reports.usage", label: "Usage reporting" },
      { key: "api.enterprise", label: "Enterprise escalation access" },
      { key: "approval-workflows.manage", label: "Workflow support" },
    ],
  },
} satisfies Record<FeatureArea, { title: string; subtitle: string; features: Array<{ key: string; label: string }> }>

export function GarageFeatureAccessPage({ access, area }: { access?: BusinessAccess; area: FeatureArea }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [addOns, setAddOns] = useState<AddOnRequest[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [subject, setSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const enabled = useMemo(() => new Set(access?.enabledFeatures ?? []), [access?.enabledFeatures])
  const requestable = useMemo(() => new Set((access?.requestableFeatures ?? []).map((item) => item.key)), [access?.requestableFeatures])
  const config = featureConfig[area]
  const accountId = access?.businessAccount.id
  const integrationAction = access?.actions?.["integrations.connect"]

  useEffect(() => {
    if (!accountId) return
    void fetch(appPath(`/api/business/add-ons?businessAccountId=${encodeURIComponent(accountId)}`))
      .then((response) => response.json())
      .then((payload) => setAddOns(payload?.addOnRequests ?? []))
      .catch(() => setAddOns([]))
    if (area === "support") {
      void fetch(appPath(`/api/business/support-tickets?businessAccountId=${encodeURIComponent(accountId)}`))
        .then((response) => response.json())
        .then((payload) => setTickets(payload?.supportTickets ?? []))
        .catch(() => setTickets([]))
    }
    if (area === "security") {
      void fetch(appPath(`/api/business/audit-logs?businessAccountId=${encodeURIComponent(accountId)}`))
        .then((response) => response.json())
        .then((payload) => setAuditLogs(payload?.auditLogs ?? []))
        .catch(() => setAuditLogs([]))
    }
  }, [accountId, area])

  async function requestAddOn(featureKey: string) {
    if (!accountId) return
    setPendingKey(featureKey)
    setMessage(null)
    try {
      const response = await fetch(appPath("/api/business/add-ons/request"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessAccountId: accountId, featureKey }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to request add-on")
      setAddOns((items) => [payload.addOnRequest, ...items.filter((item) => item.featureKey !== featureKey)])
      setMessage("Add-on request sent to Admin.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request add-on")
    } finally {
      setPendingKey(null)
    }
  }

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId) return
    setIsCreatingTicket(true)
    setMessage(null)
    try {
      const response = await fetch(appPath("/api/business/support-tickets"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessAccountId: accountId, subject, message: ticketMessage }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to create support ticket")
      setTickets((items) => [payload.supportTicket, ...items])
      setSubject("")
      setTicketMessage("")
      setMessage("Support ticket created.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create support ticket")
    } finally {
      setIsCreatingTicket(false)
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-lg border border-[#1f2937] bg-[#111827] p-5 text-white">
        <p className="text-sm text-[#9CA3AF]">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p>
        <h1 className="mt-2 text-2xl font-semibold">{config.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#9CA3AF]">{config.subtitle}</p>
        {area === "integrations" ? (
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Usage: {access?.businessAccount.usage?.integrations ?? 0}/{access?.businessAccount.limits?.integrations ?? "Unlimited"} integrations
          </p>
        ) : null}
      </section>

      {message ? <p className="rounded-md border border-[#374151] bg-[#111827] px-4 py-3 text-sm text-[#E5E7EB]">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        {config.features.map((feature) => {
          const isEnabled = enabled.has(feature.key)
          const canRequest = requestable.has(feature.key)
          return (
            <article key={feature.key} className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{feature.label}</h2>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{isEnabled ? "Included in this plan" : "Not included in this plan"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${isEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                  {isEnabled ? "Included" : canRequest ? "Add-on" : "Locked"}
                </span>
              </div>
              {!isEnabled && canRequest ? (
                <button type="button" disabled={pendingKey === feature.key} onClick={() => requestAddOn(feature.key)} className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {pendingKey === feature.key ? "Requesting..." : "Request Add-on"}
                </button>
              ) : null}
            </article>
          )
        })}
      </section>

      {addOns.length ? (
        <section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white">
          <h2 className="text-base font-semibold">Add-on Requests</h2>
          <div className="mt-3 grid gap-2">
            {addOns.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[#374151] px-3 py-2 text-sm">
                <span>{item.label}</span>
                <span className="text-[#9CA3AF]">{item.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {area === "support" ? (
        <section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white">
          <h2 className="text-base font-semibold">Support Tickets</h2>
          <form onSubmit={createTicket} className="mt-4 grid gap-3">
            <input className="h-10 rounded-sm border border-[#334155] bg-[#0b1220] px-3" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
            <textarea className="min-h-24 rounded-sm border border-[#334155] bg-[#0b1220] px-3 py-2" placeholder="Message" value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} required />
            <button type="submit" disabled={isCreatingTicket} className="w-fit rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{isCreatingTicket ? "Creating..." : "Create Ticket"}</button>
          </form>
          <div className="mt-4 grid gap-2">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-3 rounded-md border border-[#374151] px-3 py-2 text-sm">
                <span>{ticket.subject}</span>
                <span className="text-[#9CA3AF]">{ticket.priority} · {ticket.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {area === "security" ? (
        <section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Audit Logs</h2>
            {accountId ? <a className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white" href={appPath(`/api/business/audit-logs/export?businessAccountId=${encodeURIComponent(accountId)}`)}>Export CSV</a> : null}
          </div>
          <div className="mt-4 grid gap-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 rounded-md border border-[#374151] px-3 py-2 text-sm">
                <span>{log.action}</span>
                <span className="text-[#9CA3AF]">{log.actor?.name ?? log.actor?.email ?? "System"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-sm text-[#9CA3AF]">
        {integrationAction?.allowed === false ? integrationAction.reason ?? "Some actions are blocked by the current plan." : "Backend entitlements are active for this account."}
        <a href={appRoutes.plans} className="ml-2 text-primary underline">View plans</a>
      </section>
    </main>
  )
}
