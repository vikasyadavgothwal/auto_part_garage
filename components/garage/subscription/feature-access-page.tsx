"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { HelpCircle, MessageSquare, PlayCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { appPath, appRoutes } from "@/lib/routes"

type FeatureArea = "add-ons" | "integrations" | "support"
type PriceFields = { pricingModel?: string; priceAmount?: number; priceCurrency?: string; unitPriceAmount?: number; validityDays?: number }
type LimitAddOn = PriceFields & { key: string; metric: string; label: string; currentLimit: number | null; currentUsage: number; suggestedExtraUnits?: number; suggestedLimit: number }

export type BusinessAccess = {
  businessAccount: { id: string; type: string; name: string; plan: { name: string; code?: string; supportTier?: string }; limits?: Record<string, number | null>; usage?: Record<string, number | undefined> }
  enabledFeatures?: string[]
  requestableFeatures?: Array<PriceFields & { key: string; label: string }>
  limitAddOns?: LimitAddOn[]
  actions?: Record<string, { allowed: boolean; reason?: string | null }>
}

type AddOnRequest = PriceFields & { id: string; featureKey: string; label: string; status: string; priceQuantity?: number; validFrom?: string | null; validUntil?: string | null; renewalAt?: string | null }
export type SupportContent = { supportTier: string; supportSummary: string; ticketCategories: Array<{ value: string; label: string }>; videos: Array<{ id: string; title: string; description?: string | null; videoUrl: string; supportTier: string }>; faqs: Array<{ id: string; question: string; answer: string; supportTier: string }> }
type SupportVideo = SupportContent["videos"][number]
type PendingAddOnConfirmation = { featureKey: string; note?: string }
const limitFeatureKey = (metric: string, extraUnits: number) => `limit.${metric}.${extraUnits}`
const formatMoney = (amount = 0, currency = "AED") => `${currency} ${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC", year: "numeric" })
const formatValidity = (days?: number) => days ? `${days} day${days === 1 ? "" : "s"}` : "Validity not set"
const formatValidUntil = (value?: string | null) => value ? `Valid till ${dateFormatter.format(new Date(value))}` : "Validity not set"
const limitExtraUnits = (extraUnits: number) => Number.isInteger(extraUnits) ? Math.max(0, extraUnits) : 0
const limitExtraUnitText = (quantity: number) => `${quantity} extra unit${quantity === 1 ? "" : "s"}`
const limitPriceText = (item: LimitAddOn, extraUnits: number) => {
  const unitAmount = item.unitPriceAmount ?? 0
  const quantity = limitExtraUnits(extraUnits)
  return `${formatMoney(unitAmount * quantity, item.priceCurrency)} for ${limitExtraUnitText(quantity)} (${formatMoney(unitAmount, item.priceCurrency)} per extra unit)`
}
const activeAddOnStatuses = new Set(["Approved", "Enabled"])
const isAddOnCurrentlyActive = (request?: Pick<AddOnRequest, "status" | "validFrom" | "validUntil"> | null) => {
  if (!request || !activeAddOnStatuses.has(request.status)) return false
  const now = Date.now()
  if (request.validFrom && new Date(request.validFrom).getTime() > now) return false
  return !request.validUntil || new Date(request.validUntil).getTime() > now
}
const addOnStatusLabel = (request?: Pick<AddOnRequest, "status" | "validFrom" | "validUntil"> | null) =>
  isAddOnCurrentlyActive(request) ? "Already added" : request?.status === "Requested" ? "Request sent" : request?.status === "Rejected" ? "Rejected" : request?.status && activeAddOnStatuses.has(request.status) ? "Expired" : request?.status ?? "Available"
const addOnStatusClass = (request: Pick<AddOnRequest, "status" | "validFrom" | "validUntil">) =>
  isAddOnCurrentlyActive(request)
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
    : request.status === "Rejected"
      ? "border-red-500/30 bg-red-500/10 text-red-600"
      : "border-amber-500/30 bg-amber-500/10 text-amber-600"

const commonAddOnFeatureKeys = new Set([
  "integrations.manage",
  "api.standard",
  "api.enterprise",
  "staff.manage",
  "roles.manage",
  "reports.dashboard",
  "reports.usage",
  "reports.activity",
  "support.priority",
])
const commonAddOnMetrics = new Set(["staff", "roles", "permissions", "integrations"])
const addOnSections = (accountType: string, limits: LimitAddOn[], features: Array<PriceFields & { key: string; label: string }>) => [
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
]

const defaultSupport: SupportContent = { supportTier: "Basic", supportSummary: "Basic: Help videos + FAQ + standard support request", ticketCategories: [], videos: [], faqs: [] }
const isDirectVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url) || url.includes("business-support/videos/")
const youtubeThumbnailUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "").toLowerCase()
    let videoId = ""

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? ""
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const [first, second] = url.pathname.split("/").filter(Boolean)
      videoId = first === "embed" || first === "shorts" || first === "live" ? second ?? "" : url.searchParams.get("v") ?? ""
    }

    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  } catch {
    return null
  }
}
const autoplayVideoUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set("autoplay", "1")
    return parsed.toString()
  } catch {
    return url
  }
}

export function GarageFeatureAccessPage({
  access,
  area,
  initialSupport = defaultSupport,
}: {
  access?: BusinessAccess
  area: FeatureArea
  initialSupport?: SupportContent
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [limitTargets, setLimitTargets] = useState<Record<string, string>>({})
  const [addOns, setAddOns] = useState<AddOnRequest[]>([])
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
  const [support] = useState<SupportContent>(initialSupport)
  const [faqQuery, setFaqQuery] = useState("")
  const [showAllVideos, setShowAllVideos] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<SupportVideo | null>(null)
  const [pendingAddOnConfirmation, setPendingAddOnConfirmation] = useState<PendingAddOnConfirmation | null>(null)
  const [subject, setSubject] = useState("")
  const [ticketMessage, setTicketMessage] = useState("")
  const [category, setCategory] = useState("")
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const enabled = useMemo(() => new Set(access?.enabledFeatures ?? []), [access?.enabledFeatures])
  const requestable = useMemo(() => new Set((access?.requestableFeatures ?? []).map((item) => item.key)), [access?.requestableFeatures])
  const accountId = access?.businessAccount.id
  const integrationAction = access?.actions?.["integrations.connect"]
  const addOnGroups = useMemo(() => addOnSections(access?.businessAccount.type ?? "Business", access?.limitAddOns ?? [], access?.requestableFeatures ?? []), [access?.businessAccount.type, access?.limitAddOns, access?.requestableFeatures])
  const filteredFaqs = useMemo(() => {
    const query = faqQuery.trim().toLowerCase()
    if (!query) return support.faqs
    return support.faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(query))
  }, [faqQuery, support.faqs])
  const filteredVideos = useMemo(() => {
    const query = faqQuery.trim().toLowerCase()
    if (!query) return support.videos
    return support.videos.filter((video) => video.title.toLowerCase().includes(query))
  }, [faqQuery, support.videos])
  const visibleVideos = showAllVideos ? filteredVideos : filteredVideos.slice(0, 3)
  const hasMoreVideos = filteredVideos.length > visibleVideos.length

  useEffect(() => {
    if (!accountId || area !== "add-ons") return
    void fetch(appPath(`/api/business/add-ons?businessAccountId=${encodeURIComponent(accountId)}`)).then((response) => response.json()).then((payload) => setAddOns(payload?.addOnRequests ?? [])).catch(() => setAddOns([]))
  }, [accountId, area])

  if (area === "add-ons") return <main className="space-y-6">
    <Card><CardHeader><p className="text-sm text-muted-foreground">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p><CardTitle>Paid Add-ons</CardTitle><CardDescription>Add a feature that is not included in your plan. Confirm once and it will be enabled for your account.</CardDescription></CardHeader></Card>
    {addOns.length ? <Card><CardHeader><CardTitle className="text-base">Your add-ons</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{addOns.map((item) => <span key={item.id} className={`rounded-full border px-3 py-1 text-sm ${addOnStatusClass(item)}`}>{item.label}: {addOnStatusLabel(item)} · {formatValidUntil(item.validUntil)}</span>)}</CardContent></Card> : null}
    {addOnGroups.map((section) => <section key={section.title} className="space-y-3"><div><h2 className="text-base font-semibold text-foreground">{section.title}</h2><p className="text-sm text-muted-foreground">{section.description}</p></div>{section.limits.length ? <div className="grid gap-4 md:grid-cols-2">{section.limits.map((item) => { const rawExtraUnits = limitTargets[item.metric] ?? String(item.suggestedExtraUnits ?? 5); const extraUnits = Number(rawExtraUnits); const featureKey = Number.isInteger(extraUnits) ? limitFeatureKey(item.metric, extraUnits) : item.key; const request = addOns.find((row) => row.featureKey === featureKey); const active = isAddOnCurrentlyActive(request); const waiting = request?.status === "Requested"; const currentLimit = item.currentLimit ?? 0; const addedCapacity = limitExtraUnits(extraUnits); const newTotalLimit = currentLimit + addedCapacity; const invalid = !Number.isInteger(extraUnits) || extraUnits < 1; return <Card key={item.metric}><CardHeader><CardTitle className="text-base">{item.label}</CardTitle><CardDescription>Enter how many extra units you want to add to your current limit.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-[1fr_auto]"><input type="number" inputMode="numeric" min={1} step={1} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" value={rawExtraUnits} onChange={(event) => setLimitTargets((targets) => ({ ...targets, [item.metric]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} /><Button disabled={pendingKey === featureKey || active || waiting || invalid} onClick={() => requestAddOn(featureKey, `Add ${addedCapacity} extra units. New total limit after add-on: ${newTotalLimit}.`)}>{pendingKey === featureKey ? "Adding..." : active ? "Already added" : waiting ? "Request sent" : request?.status === "Rejected" ? "Add again" : "Add extra limit"}</Button><div className="text-xs text-muted-foreground sm:col-span-2"><p>{addOnStatusLabel(request)}{request ? ` · ${formatValidUntil(request.validUntil)}` : ""}</p><p>Current total limit: {item.currentLimit ?? "Unlimited"} · Current usage: {item.currentUsage}</p><p>New total limit after add-on: {Number.isInteger(extraUnits) ? newTotalLimit : "Enter a valid number"} · Added capacity: {limitExtraUnitText(addedCapacity)}</p><p>Estimated price: {limitPriceText(item, addedCapacity)}</p><p>Validity: {formatValidity(item.validityDays)}</p></div></CardContent></Card> })}</div> : null}{section.features.length ? <div className="grid gap-4 md:grid-cols-2">{section.features.map((feature) => { const request = addOns.find((item) => item.featureKey === feature.key); const active = isAddOnCurrentlyActive(request); const waiting = request?.status === "Requested"; return <Card key={feature.key}><CardHeader><CardTitle className="text-base">{feature.label}</CardTitle><CardDescription>Available as an add-on without changing your current plan.</CardDescription></CardHeader><CardContent className="flex items-center justify-between gap-3"><div><span className="text-sm text-muted-foreground">{addOnStatusLabel(request)}{request ? ` · ${formatValidUntil(request.validUntil)}` : ""}</span><p className="text-xs text-muted-foreground">Price: {formatMoney(feature.priceAmount, feature.priceCurrency)}</p><p className="text-xs text-muted-foreground">Validity: {formatValidity(feature.validityDays)}</p></div><Button disabled={pendingKey === feature.key || active || waiting} onClick={() => requestAddOn(feature.key)}>{pendingKey === feature.key ? "Adding..." : active ? "Already added" : waiting ? "Request sent" : request?.status === "Rejected" ? "Add again" : "Add Add-on"}</Button></CardContent></Card> })}</div> : null}</section>)}
    {!addOnGroups.length ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">No additional paid features are available for this account.</CardContent></Card> : null}
    <Dialog open={Boolean(pendingAddOnConfirmation)} onOpenChange={(open) => { if (!open) setPendingAddOnConfirmation(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add paid add-on</DialogTitle>
          <DialogDescription>This add-on will be enabled for your garage account.</DialogDescription>
        </DialogHeader>
        {pendingAddOnConfirmation?.note ? <p className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">{pendingAddOnConfirmation.note}</p> : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" disabled={pendingKey === pendingAddOnConfirmation?.featureKey} onClick={() => pendingAddOnConfirmation ? confirmAddOnRequest(pendingAddOnConfirmation) : undefined}>
            {pendingKey === pendingAddOnConfirmation?.featureKey ? "Adding..." : "Confirm add-on"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>

  function requestAddOn(featureKey: string, note?: string) {
    if (!accountId) return
    setPendingAddOnConfirmation({ featureKey, note })
  }

  async function confirmAddOnRequest({ featureKey, note }: PendingAddOnConfirmation) {
    if (!accountId) return
    setPendingKey(featureKey)
    try {
      const response = await fetch(appPath("/api/business/add-ons/request"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessAccountId: accountId, featureKey, note, paymentSuccessUrl: `${window.location.origin}${appPath("/add-ons")}?payment=success&session_id={CHECKOUT_SESSION_ID}`, paymentCancelUrl: `${window.location.origin}${appPath("/add-ons")}?payment=cancelled` }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to request add-on")
      if (payload?.addOnRequest?.payment?.checkoutUrl) {
        window.location.assign(payload.addOnRequest.payment.checkoutUrl)
        return
      }
      setAddOns((items) => [payload.addOnRequest, ...items.filter((item) => item.featureKey !== featureKey)])
      setPendingAddOnConfirmation(null)
      toast.success("Add-on enabled.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to request add-on") } finally { setPendingKey(null) }
  }

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId) return
    const normalizedSubject = subject.trim()
    const normalizedMessage = ticketMessage.trim()
    if (normalizedSubject.length < 3 || normalizedSubject.length > 150) return toast.error("Subject must be between 3 and 150 characters")
    if (normalizedMessage.length < 10 || normalizedMessage.length > 2000) return toast.error("Message must be between 10 and 2000 characters")
    setIsCreatingTicket(true)
    try {
      const response = await fetch(appPath("/api/business/help-tickets"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessAccountId: accountId, subject: normalizedSubject, message: normalizedMessage, category: category || undefined }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to create support ticket")
      setSubject(""); setTicketMessage(""); setCategory(""); setIsTicketDialogOpen(false); toast.success("Support ticket created. We will contact you shortly and help resolve your problem.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create support ticket") } finally { setIsCreatingTicket(false) }
  }

  if (area === "integrations") return <main className="space-y-6"><section className="rounded-lg border border-[#1f2937] bg-[#111827] p-5 text-white"><p className="text-sm text-[#9CA3AF]">Current plan: {access?.businessAccount.plan.name ?? "Unavailable"}</p><h1 className="mt-2 text-2xl font-semibold">Integrations</h1><p className="mt-2 max-w-3xl text-sm text-[#9CA3AF]">Connect tools allowed by the current plan.</p><p className="mt-3 text-sm text-[#9CA3AF]">Usage: {access?.businessAccount.usage?.integrations ?? 0}/{access?.businessAccount.limits?.integrations ?? "Unlimited"} integrations</p></section><section className="grid gap-4 md:grid-cols-2">{integrationFeatures.map((feature) => { const isEnabled = enabled.has(feature.key); const canRequest = requestable.has(feature.key); return <article key={feature.key} className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-white"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold">{feature.label}</h2><p className="mt-1 text-xs text-[#9CA3AF]">{isEnabled ? "Included in this plan" : "Not included in this plan"}</p></div><span className={`rounded-full px-3 py-1 text-xs ${isEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{isEnabled ? "Included" : canRequest ? "Add-on" : "Locked"}</span></div>{!isEnabled && canRequest ? <button type="button" disabled={pendingKey === feature.key} onClick={() => requestAddOn(feature.key)} className="mt-4 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{pendingKey === feature.key ? "Adding..." : "Add Add-on"}</button> : null}</article> })}</section><section className="rounded-lg border border-[#1f2937] bg-[#111827] p-4 text-sm text-[#9CA3AF]">{integrationAction?.allowed === false ? integrationAction.reason ?? "Some actions are blocked by the current plan." : "Backend entitlements are active for this account."}<a href={appRoutes.plans} className="ml-2 text-primary underline">View plans</a></section></main>

  return <main className="space-y-6">
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Support Center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">How can we help your garage?</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Find answers, watch quick tutorials, or send a support request if you need help from the Auto Parts Pro team.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={faqQuery} onChange={(event) => setFaqQuery(event.target.value.slice(0, 100))} maxLength={100} placeholder="Search support center" className="h-11 pl-9" />
        </div>
      </div>
    </section>

    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />Popular guides and FAQs</CardTitle>
        <CardDescription>Step-by-step answers for the most common garage dashboard questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {filteredFaqs.map((faq) => (
            <details key={faq.id} className="group rounded-lg border border-border bg-background/70 p-4 transition-colors open:bg-muted/40">
              <summary className="cursor-pointer font-medium text-foreground">{faq.question}</summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
          {!filteredFaqs.length ? <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{support.faqs.length ? "No FAQs match your search." : "No FAQs are available yet."}</p> : null}
        </div>
      </CardContent>
    </Card>

    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5 text-primary" />Quick start video tutorials</CardTitle>
        <CardDescription>Short walkthroughs for the garage dashboard workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredVideos.length ? <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleVideos.map((video) => {
              const thumbnail = youtubeThumbnailUrl(video.videoUrl)
              return (
                <article key={video.id} className="overflow-hidden rounded-lg border border-border bg-background/70 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <h3 className="truncate text-sm font-semibold text-foreground">{video.title}</h3>
                    <PlayCircle className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <button type="button" onClick={() => setSelectedVideo(video)} className="group relative block aspect-video w-full overflow-hidden bg-black text-left">
                    {thumbnail ? (
                      <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${thumbnail})` }} aria-hidden="true" />
                    ) : (
                      <video src={video.videoUrl} className="h-full w-full object-cover" muted preload="metadata" playsInline aria-hidden="true" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 transition group-hover:bg-black/20">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <PlayCircle className="h-7 w-7" />
                      </span>
                    </span>
                    <span className="sr-only">Play {video.title}</span>
                  </button>
                </article>
              )
            })}
          </div>
          {hasMoreVideos ? <div className="mt-5 flex justify-center"><Button type="button" variant="outline" onClick={() => setShowAllVideos(true)}>Show more videos</Button></div> : null}
        </> : (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{support.videos.length ? "No videos match your search." : "No support video is available yet."}</p>
        )}
      </CardContent>
    </Card>

    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Contact our support team</CardTitle>
        <CardDescription>Open a support request if the guides and tutorials do not solve the issue.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setIsTicketDialogOpen(true)}>Raise support ticket</Button>
      </CardContent>
    </Card>

    <Dialog open={Boolean(selectedVideo)} onOpenChange={(open) => { if (!open) setSelectedVideo(null) }}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border bg-background p-4 pr-12">
          <DialogTitle className="break-words">{selectedVideo?.title}</DialogTitle>
          <DialogDescription>Video tutorial</DialogDescription>
        </DialogHeader>
        {selectedVideo ? <div className="aspect-video bg-black">
          {isDirectVideoUrl(selectedVideo.videoUrl) ? (
            <video src={selectedVideo.videoUrl} className="h-full w-full" controls autoPlay preload="metadata" />
          ) : (
            <iframe src={autoplayVideoUrl(selectedVideo.videoUrl)} title={selectedVideo.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
          )}
        </div> : null}
      </DialogContent>
    </Dialog>

    <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise support ticket</DialogTitle>
          <DialogDescription>Send the issue to Admin support for this garage account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={createTicket} className="grid gap-3">
          {support.ticketCategories.length ? <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary" value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Select support option</option>{support.ticketCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : null}
          <input className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" placeholder="Subject *" value={subject} onChange={(event) => setSubject(event.target.value.slice(0, 150))} minLength={3} maxLength={150} required />
          <textarea className="min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" placeholder="Message *" value={ticketMessage} onChange={(event) => setTicketMessage(event.target.value.slice(0, 2000))} minLength={10} maxLength={2000} required />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsTicketDialogOpen(false)} disabled={isCreatingTicket}>Cancel</Button>
            <Button type="submit" disabled={isCreatingTicket}>{isCreatingTicket ? "Creating..." : "Create Ticket"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </main>
}
