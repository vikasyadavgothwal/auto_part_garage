"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { appPath, appRoutes } from "@/lib/routes"

type FeatureArea = "add-ons" | "integrations" | "support"
type LimitAddOn = { key: string; metric: string; label: string; currentLimit: number | null; currentUsage: number; suggestedLimit: number }

export type BusinessAccess = {
  businessAccount: { id: string; type: string; name: string; plan: { name: string; supportTier?: string }; limits?: Record<string, number | null>; usage?: Record<string, number | undefined> }
  enabledFeatures?: string[]
  requestableFeatures?: Array<{ key: string; label: string }>
  limitAddOns?: LimitAddOn[]
  actions?: Record<string, { allowed: boolean; reason?: string | null }>
}

type AddOnRequest = { id: string; featureKey: string; label: string; status: string }
type SupportTicket = { id: string; subject: string; message: string; status: string; priority: string; category?: string | null; createdAt: string }
type TicketPagination = { total: number; page: number; pageSize: number; totalPages: number }
type SupportContent = { supportTier: string; supportSummary: string; ticketCategories: Array<{ value: string; label: string }>; videos: Array<{ id: string; title: string; description?: string | null; videoUrl: string; supportTier: string }>; faqs: Array<{ id: string; question: string; answer: string; supportTier: string }> }
const limitFeatureKey = (metric: string, target: number) => `limit.${metric}.${target}`

const commonAddOnFeatureKeys = new Set([
  "business.saved-searches.create",
  "integrations.manage",
  "api.standard",
  "api.enterprise",
  "approval-workflows.manage",
  "staff.manage",
  "roles.manage",
  "permissions.manage",
  "reports.dashboard",
  "reports.usage",
  "reports.activity",
  "support.priority",
])
const commonAddOnMetrics = new Set(["staff", "roles", "permissions", "integrations", "savedSearches"])
const addOnSections = (accountType: string, limits: LimitAddOn[], features: Array<{ key: string; label: string }>) => [
  {
    title: "Common add-ons",
    description: "Shared limits and platform features used across Garage, Fleet, and Supplier accounts.",
    limits: limits.filter((item) => commonAddOnMetrics.has(item.metric)),
    features: features.filter((item) => commonAddOnFeatureKeys.has(item.key)),
  },
  {
    title: (accountType || "Business") + " add-ons",
    description: "Add-ons specific to this " + (accountType || "business").toLowerCase() + " account.",
    limits: limits.filter((item) => !commonAddOnMetrics.has(item.metric)),
    features: features.filter((item) => !commonAddOnFeatureKeys.has(item.key)),
  },
].filter((section) => section.limits.length || section.features.length)

const integrationFeatures = [
  { key: "integrations.manage", label: "External system connections" },
  { key: "api.standard", label: "Standard API access" },
  { key: "api.enterprise", label: "Enterprise API access" },
  { key: "approval-workflows.manage", label: "Approval workflow automation" },
]

const defaultSupport: SupportContent = { supportTier: "Basic", supportSummary: "Basic: Help videos + FAQ + standard support request", ticketCategories: [], videos: [], faqs: [] }
const ticketStatus = (status: string) => ({
  label: status === "InProgress" ? "In Progress" : status,
  className: status === "Open"
    ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
    : status === "InProgress"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
      : status === "Resolved"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
        : "border-slate-500/30 bg-slate-500/10 text-slate-600",
})
const isDirectVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url) || url.includes("business-support/videos/")

export function GarageFeatureAccessPage({ access, area }: { access?: BusinessAccess; area: FeatureArea }) {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [limitTargets, setLimitTargets] = useState<Record<string, string>>({})
  const [addOns, setAddOns] = useState<AddOnRequest[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketPagination, setTicketPagination] = useState<TicketPagination>({ total: 0, page: 1, pageSize: 10, totalPages: 1 })
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketRefresh, setTicketRefresh] = useState(0)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [support, setSupport] = useState<SupportContent>(defaultSupport)
  const [subject, setSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [category, setCategory] = useState("")
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const enabled = useMemo(() => new Set(access?.enabledFeatures ?? []), [access?.enabledFeatures])
  const requestable = useMemo(() => new Set((access?.requestableFeatures ?? []).map((item) => item.key)), [access?.requestableFeatures])
  const accountId = access?.businessAccount.id
  const integrationAction = access?.actions?.["integrations.connect"]
  const addOnGroups = useMemo(() => addOnSections(access?.businessAccount.type ?? "Business", access?.limitAddOns ?? [], access?.requestableFeatures ?? []), [access?.businessAccount.type, access?.limitAddOns, access?.requestableFeatures])

  useEffect(() => {
    if (!accountId) return
    void fetch(appPath(`/api/business/add-ons?businessAccountId=${encodeURIComponent(accountId)}`)).then((response) => response.json()).then((payload) => setAddOns(payload?.addOnRequests ?? [])).catch(() => setAddOns([]))
    if (area === "support") {
      void fetch(appPath(`/api/business/support-tickets?businessAccountId=${encodeURIComponent(accountId)}&page=${ticketPage}&pageSize=10`)).then((response) => response.json()).then((payload) => { setTickets(payload?.supportTickets ?? []); setTicketPagination(payload?.pagination ?? { total: 0, page: ticketPage, pageSize: 10, totalPages: 1 }) }).catch(() => setTickets([]))
      void fetch(appPath(`/api/business/support-content?businessAccountId=${encodeURIComponent(accountId)}`)).then((response) => response.json()).then((payload) => setSupport(payload?.support ?? defaultSupport)).catch(() => setSupport(defaultSupport))
    }
  }, [accountId, area, ticketPage, ticketRefresh])

  if (area === "add-ons") return <main className="space-y-6">
    <Card><CardHeader><p className="text-sm text-muted-foreground">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p><CardTitle>Paid Add-ons</CardTitle><CardDescription>Request a feature that is not included in your plan. Admin will confirm payment and enable it for your account.</CardDescription></CardHeader></Card>
    {addOns.some((item) => item.status === "Enabled") ? <Card><CardHeader><CardTitle className="text-base">Enabled add-ons</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{addOns.filter((item) => item.status === "Enabled").map((item) => <span key={item.id} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600">{item.label}</span>)}</CardContent></Card> : null}
    {addOnGroups.map((section) => <section key={section.title} className="space-y-3"><div><h2 className="text-base font-semibold text-foreground">{section.title}</h2><p className="text-sm text-muted-foreground">{section.description}</p></div>{section.limits.length ? <div className="grid gap-4 md:grid-cols-2">{section.limits.map((item) => { const rawTarget = limitTargets[item.metric] ?? String(item.suggestedLimit); const target = Number(rawTarget); const featureKey = Number.isInteger(target) ? limitFeatureKey(item.metric, target) : item.key; const request = addOns.find((row) => row.featureKey === featureKey); const waiting = request?.status === "Requested" || request?.status === "Approved"; const currentLimit = item.currentLimit ?? 0; const invalid = !Number.isInteger(target) || target <= currentLimit; return <Card key={item.metric}><CardHeader><CardTitle className="text-base">{item.label}</CardTitle><CardDescription>Current usage: {item.currentUsage}/{item.currentLimit ?? "Unlimited"}. Request the total limit you need for this account.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]"><input type="number" min={currentLimit + 1} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" value={rawTarget} onChange={(event) => setLimitTargets((targets) => ({ ...targets, [item.metric]: event.target.value }))} /><Button disabled={pendingKey === featureKey || waiting || invalid} onClick={() => requestAddOn(featureKey, `Requested total limit: ${target}`)}>{pendingKey === featureKey ? "Requesting..." : waiting ? "Request sent" : "Request limit"}</Button><p className="text-xs text-muted-foreground sm:col-span-2">{request?.status ?? "Available as paid add-on"}</p></CardContent></Card> })}</div> : null}{section.features.length ? <div className="grid gap-4 md:grid-cols-2">{section.features.map((feature) => { const request = addOns.find((item) => item.featureKey === feature.key); const waiting = request?.status === "Requested" || request?.status === "Approved"; return <Card key={feature.key}><CardHeader><CardTitle className="text-base">{feature.label}</CardTitle><CardDescription>Available as a paid add-on without changing your current plan.</CardDescription></CardHeader><CardContent className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{request?.status ?? "Available"}</span><Button disabled={pendingKey === feature.key || waiting} onClick={() => requestAddOn(feature.key)}>{pendingKey === feature.key ? "Requesting..." : waiting ? "Request sent" : "Request Add-on"}</Button></CardContent></Card> })}</div> : null}</section>)}
    {!addOnGroups.length ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">No additional paid features are available for this account.</CardContent></Card> : null}
  </main>

  async function requestAddOn(featureKey: string, note?: string) {
    if (!accountId) return
    setPendingKey(featureKey)
    try {
      const response = await fetch(appPath("/api/business/add-ons/request"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessAccountId: accountId, featureKey, note }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to request add-on")
      setAddOns((items) => [payload.addOnRequest, ...items.filter((item) => item.featureKey !== featureKey)])
      toast.success("Add-on request sent to Admin.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to request add-on") } finally { setPendingKey(null) }
  }

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId) return
    setIsCreatingTicket(true)
    try {
      const response = await fetch(appPath("/api/business/support-tickets"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessAccountId: accountId, subject, message: ticketMessage, category: category || undefined }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to create support ticket")
      setSubject(""); setTicketMessage(""); setCategory(""); setTicketPage(1); setTicketRefresh((value) => value + 1); toast.success("Support ticket created.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create support ticket") } finally { setIsCreatingTicket(false) }
  }

  if (area === "integrations") return <main className="space-y-6"><section className="rounded-lg border border-[#1f2937] bg-[#111827] p-5 text-white"><p className="text-sm text-[#9CA3AF]">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p><h1 className="mt-2 text-2xl font-semibold">Integrations</h1><p className="mt-2 max-w-3xl text-sm text-[#9CA3AF]">Connect tools allowed by the current plan.</p><p className="mt-3 text-sm text-[#9CA3AF]">Usage: {access?.businessAccount.usage?.integrations ?? 0}/{access?.businessAccount.limits?.integrations ?? "Unlimited"} integrations</p></section><section className="grid gap-4 md:grid-cols-2">{integrationFeatures.map((feature) => { const isEnabled = enabled.has(feature.key); const canRequest = requestable.has(feature.key); return <article key={feature.key} className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold">{feature.label}</h2><p className="mt-1 text-xs text-[#9CA3AF]">{isEnabled ? "Included in this plan" : "Not included in this plan"}</p></div><span className={`rounded-full px-3 py-1 text-xs ${isEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{isEnabled ? "Included" : canRequest ? "Add-on" : "Locked"}</span></div>{!isEnabled && canRequest ? <button type="button" disabled={pendingKey === feature.key} onClick={() => requestAddOn(feature.key)} className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{pendingKey === feature.key ? "Requesting..." : "Request Add-on"}</button> : null}</article> })}</section><section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-sm text-[#9CA3AF]">{integrationAction?.allowed === false ? integrationAction.reason ?? "Some actions are blocked by the current plan." : "Backend entitlements are active for this account."}<a href={appRoutes.plans} className="ml-2 text-primary underline">View plans</a></section></main>

  return <main className="space-y-6">
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="bg-gradient-to-br from-primary/10 via-card to-muted/30 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Support</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{support.supportSummary}</p>
          </div>
          <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{support.supportTier} support</span>
        </div>
      </div>
    </section>

    {support.videos.length ? <section className="grid gap-4 lg:grid-cols-2">
      {support.videos.map((video) => (
        <article key={video.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="aspect-video bg-black">
            {isDirectVideoUrl(video.videoUrl) ? <video src={video.videoUrl} className="h-full w-full" controls preload="metadata" /> : <iframe src={video.videoUrl} title={video.title} className="h-full w-full" allowFullScreen />}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-foreground">{video.title}</h2>
              <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">{video.supportTier}</span>
            </div>
            {video.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{video.description}</p> : null}
          </div>
        </article>
      ))}
    </section> : null}

    {support.faqs.length ? <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">FAQ</h2>
      <div className="mt-4 grid gap-3">
        {support.faqs.map((faq) => (
          <details key={faq.id} className="group rounded-lg border border-border bg-background/60 p-4 transition-colors open:bg-muted/40">
            <summary className="cursor-pointer font-medium text-foreground">{faq.question}</summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section> : null}

    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">Support Request</h2>
        <p className="text-sm text-muted-foreground">Raise a ticket based on your current support plan.</p>
      </div>
      <form onSubmit={createTicket} className="mt-4 grid gap-3">
        {support.ticketCategories.length ? <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Select support option</option>{support.ticketCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : null}
        <input className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
        <textarea className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" placeholder="Message" value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value)} required />
        <button type="submit" disabled={isCreatingTicket} className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">{isCreatingTicket ? "Creating..." : "Create Ticket"}</button>
      </form>
      <div className="mt-6 space-y-4">
        <div><h3 className="font-semibold text-foreground">Ticket history</h3><p className="text-sm text-muted-foreground">Track every request and its latest Admin status.</p></div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Category</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {tickets.map((ticket) => { const status = ticketStatus(ticket.status); return <TableRow key={ticket.id} tabIndex={0} className="cursor-pointer" onClick={() => setSelectedTicket(ticket)} onKeyDown={(event) => { if (event.key === "Enter") setSelectedTicket(ticket) }}><TableCell><p className="font-medium text-foreground">{ticket.subject}</p><p className="max-w-xs truncate text-xs text-muted-foreground">{ticket.message}</p></TableCell><TableCell>{ticket.category ?? "Standard request"}</TableCell><TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell><TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge><p className="mt-1 text-xs text-muted-foreground">{ticket.priority} priority</p></TableCell></TableRow> })}
              {!tickets.length ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No support tickets yet.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Showing {ticketPagination.total ? (ticketPagination.page - 1) * ticketPagination.pageSize + 1 : 0}-{Math.min(ticketPagination.page * ticketPagination.pageSize, ticketPagination.total)} of {ticketPagination.total}</p><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={ticketPage <= 1} onClick={() => setTicketPage((page) => page - 1)}>Previous</Button><span>Page {ticketPagination.page} of {ticketPagination.totalPages}</span><Button type="button" variant="outline" size="sm" disabled={ticketPage >= ticketPagination.totalPages} onClick={() => setTicketPage((page) => page + 1)}>Next</Button></div></div>
      </div>
      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => { if (!open) setSelectedTicket(null) }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="break-words">{selectedTicket?.subject}</DialogTitle><DialogDescription>Support ticket details and current status.</DialogDescription></DialogHeader>{selectedTicket ? <div className="space-y-4"><div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={`mt-1 ${ticketStatus(selectedTicket.status).className}`}>{ticketStatus(selectedTicket.status).label}</Badge></div><div><p className="text-xs text-muted-foreground">Priority</p><p className="font-medium">{selectedTicket.priority}</p></div><div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{selectedTicket.category ?? "Standard request"}</p></div><div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</p></div></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</p><p className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm leading-6">{selectedTicket.message}</p></div></div> : null}</DialogContent></Dialog>
    </section>
  </main>
}
