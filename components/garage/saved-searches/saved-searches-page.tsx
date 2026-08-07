"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { appPath, appRoutes } from "@/lib/routes"

type SavedSearch = {
  id: string
  name: string
  scope: string
  query: Record<string, unknown>
  createdAt: string
}

type BusinessAccess = {
  businessAccount?: {
    id: string
    usage?: { savedSearches?: number }
    limits?: { savedSearches?: number | null }
  }
  actions?: Record<string, { allowed: boolean; reason?: string | null }>
}

const scopeOptions = [
  { value: "garage.bookings", label: "Bookings", route: appRoutes.bookings },
  { value: "garage.services", label: "Services", route: appRoutes.services },
  { value: "garage.reviews", label: "Reviews", route: appRoutes.reviews },
] as const

const formatLimit = (used?: number, limit?: number | null) =>
  `${used ?? 0}/${limit == null ? "Unlimited" : limit}`

const queryToParams = (query: Record<string, unknown>) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.trim()) params.set(key, value.trim())
    if (typeof value === "number" || typeof value === "boolean") params.set(key, String(value))
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          params.append(key, String(item))
        }
      }
    }
  }
  if (Object.keys(query).length) params.set("savedFilters", JSON.stringify(query))
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export function GarageSavedSearchesPage({
  access,
  initialSavedSearches,
}: {
  access: BusinessAccess | null | undefined
  initialSavedSearches: SavedSearch[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [scope, setScope] = useState<(typeof scopeOptions)[number]["value"]>("garage.bookings")
  const [queryText, setQueryText] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const canSave = access?.actions?.["saved-searches.create"]?.allowed ?? false
  const accountId = access?.businessAccount?.id

  async function saveSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId || !canSave) {
      setMessage(access?.actions?.["saved-searches.create"]?.reason ?? "Saved searches are not available on this plan.")
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch(appPath("/api/business/saved-searches"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessAccountId: accountId, name, scope, query: { q: queryText.trim() } }),
      })
      const payload = await response.json().catch(() => null) as { message?: string } | null
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save search")
      setName("")
      setQueryText("")
      setMessage("Saved search created.")
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save search")
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteSearch(id: string) {
    if (!accountId) return
    const response = await fetch(
      appPath(`/api/business/saved-searches/${encodeURIComponent(id)}?businessAccountId=${encodeURIComponent(accountId)}`),
      { method: "DELETE" },
    )
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null
      setMessage(payload?.message ?? "Unable to delete saved search")
      return
    }
    setMessage("Saved search deleted.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saved Searches</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save repeat garage filters and open them quickly.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Plan usage: {formatLimit(access?.businessAccount?.usage?.savedSearches, access?.businessAccount?.limits?.savedSearches)} saved searches
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold">Create saved search</h2>
        <form onSubmit={saveSearch} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
          <input className="h-10 rounded-sm border bg-background px-3" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <select className="h-10 rounded-sm border bg-background px-3" value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}>
            {scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="h-10 rounded-sm border bg-background px-3" placeholder="Search text or filter keyword" value={queryText} onChange={(event) => setQueryText(event.target.value)} />
          <Button type="submit" disabled={isSaving || !canSave}>{isSaving ? "Saving..." : "Save"}</Button>
        </form>
        {!canSave ? <p className="mt-3 text-sm text-amber-600">{access?.actions?.["saved-searches.create"]?.reason ?? "Upgrade your plan to save searches."}</p> : null}
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </section>

      <section className="grid gap-3">
        {initialSavedSearches.length ? initialSavedSearches.map((item) => {
          const option = scopeOptions.find((candidate) => candidate.value === item.scope) ?? scopeOptions[0]
          return (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{option.label} · {String(item.query?.q ?? "No keyword")}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="secondary" className="gap-2">
                  <Link href={`${option.route}${queryToParams(item.query)}`}><Search className="h-4 w-4" /> Re-run</Link>
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => void deleteSearch(item.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          )
        }) : (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No saved searches yet.</p>
        )}
      </section>
    </div>
  )
}
