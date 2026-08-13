"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Copy, KeyRound, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { appPath } from "@/lib/routes"

type BusinessAccess = { businessAccount: { id: string; name: string; type: string; plan: { name: string } } }
type ApiAccess = { allowed: boolean; code: string; message: string; apiTier: string; availableScopes: Array<{ key: string; label: string }> }
type ApiKeyRecord = { id: string; name: string; keyPrefix: string; maskedKey: string; scopes: string[]; status: string; createdAt: string; lastUsedAt: string | null }

export function GarageApiKeysPage({ access }: { access?: BusinessAccess }) {
  const accountId = access?.businessAccount.id
  const [apiAccess, setApiAccess] = useState<ApiAccess | null>(null)
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [name, setName] = useState("My website backend")
  const [scopes, setScopes] = useState<string[]>([])
  const [secret, setSecret] = useState("")
  const [revokeKey, setRevokeKey] = useState<ApiKeyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requestingEnterprise, setRequestingEnterprise] = useState(false)
  const [enterpriseRequested, setEnterpriseRequested] = useState(false)
  const [notice, setNotice] = useState("")
  const scopeOptions = apiAccess?.availableScopes ?? []

  const selectedScopes = useMemo(() => new Set(scopes), [scopes])

  useEffect(() => {
    if (!accountId) return
    let cancelled = false
    void fetch(appPath(`/api/business/api-keys?businessAccountId=${encodeURIComponent(accountId)}`), { credentials: "include" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) }))
      .then(({ response, payload }) => {
        if (cancelled) return
        setApiAccess(payload.apiAccess ?? null)
        setKeys(payload.apiKeys ?? [])
        setScopes((current) => current.length ? current : (payload.apiAccess?.availableScopes ?? []).filter((scope: { key: string }) => scope.key.endsWith(".read")).map((scope: { key: string }) => scope.key))
        if (!response.ok || payload?.ok === false) setNotice(payload?.message ?? "Unable to load API keys")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    void fetch(appPath(`/api/business/add-ons?businessAccountId=${encodeURIComponent(accountId)}`), { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setEnterpriseRequested((payload.addOnRequests ?? []).some((item: { featureKey: string; status: string }) => item.featureKey === "api.enterprise" && (item.status === "Requested" || item.status === "Approved" || item.status === "Enabled")))
      })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [accountId])

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!accountId || !apiAccess?.allowed) return
    setSaving(true)
    setNotice("")
    const response = await fetch(appPath("/api/business/api-keys"), {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ businessAccountId: accountId, name, scopes }),
    })
    const payload = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok || payload?.ok === false) {
      setNotice(payload?.message ?? "Unable to create API key")
      return
    }
    setSecret(payload.apiKey)
    setKeys((current) => [payload.key, ...current])
    setName("My website backend")
  }

  async function revokeSelectedKey() {
    if (!accountId || !revokeKey) return
    setSaving(true)
    const response = await fetch(appPath(`/api/business/api-keys/${encodeURIComponent(revokeKey.id)}?businessAccountId=${encodeURIComponent(accountId)}`), { method: "DELETE", credentials: "include" })
    const payload = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok || payload?.ok === false) {
      setNotice(payload?.message ?? "Unable to revoke API key")
      return
    }
    setKeys((current) => current.map((item) => item.id === revokeKey.id ? payload.apiKey : item))
    setRevokeKey(null)
  }

  const toggleScope = (key: string, checked: boolean | "indeterminate") =>
    setScopes((current) => checked === true ? Array.from(new Set([...current, key])) : current.filter((scope) => scope !== key))

  async function copyApiKey() {
    try {
      await navigator.clipboard.writeText(secret)
      toast.success("API key copied successfully")
    } catch {
      toast.error("Unable to copy API key")
    }
  }

  async function requestEnterpriseApi() {
    if (!accountId) return
    setRequestingEnterprise(true)
    try {
      const response = await fetch(appPath("/api/business/add-ons/request"), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessAccountId: accountId, featureKey: "api.enterprise" }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) throw new Error(payload?.message ?? "Unable to request Enterprise API access")
      setEnterpriseRequested(true)
      toast.success("Enterprise API access request sent to Admin")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request Enterprise API access")
    } finally {
      setRequestingEnterprise(false)
    }
  }

  if (!access) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Business account access is unavailable.</CardContent></Card>

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary"><KeyRound className="h-5 w-5" /></span>
            <div>
              <CardTitle>Developer API Keys</CardTitle>
              <CardDescription>Use server-side API keys to connect your own website, CRM, or backend to your Garage data.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Info label="Account" value={access.businessAccount.name} />
          <Info label="Plan" value={access.businessAccount.plan.name} />
          <Info label="API tier" value={apiAccess?.apiTier ?? "Checking"} />
        </CardContent>
      </Card>

      {notice ? <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="p-4 text-sm text-amber-700">{notice}</CardContent></Card> : null}

      {apiAccess?.allowed && apiAccess.apiTier === "standard" ? <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-medium">Need higher API capacity?</p><p className="mt-1 text-sm text-muted-foreground">Request Enterprise API access to increase each API key from 120 to 600 requests per minute.</p></div><Button type="button" disabled={requestingEnterprise || enterpriseRequested} onClick={() => void requestEnterpriseApi()}>{requestingEnterprise ? "Requesting..." : enterpriseRequested ? "Request sent" : "Request Enterprise API access"}</Button></CardContent></Card> : null}


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create API key</CardTitle>
          <CardDescription>The full key is shown once. Store it in your server environment, never in frontend JavaScript.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createKey} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Key name</Label>
              <Input id="api-key-name" value={name} onChange={(event) => setName(event.target.value)} disabled={!apiAccess?.allowed || saving} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {scopeOptions.map((scope) => (
                <label key={scope.key} className="flex gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                  <Checkbox checked={selectedScopes.has(scope.key)} onCheckedChange={(checked) => toggleScope(scope.key, checked)} disabled={!apiAccess?.allowed || saving} />
                  <span><span className="font-medium">{scope.label}</span><span className="block text-xs text-muted-foreground">{scope.key}</span></span>
                </label>
              ))}
            </div>
            <Button type="submit" disabled={!apiAccess?.allowed || saving || !scopes.length}>{saving ? "Creating..." : "Create key"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">API keys</CardTitle><CardDescription>Revoke keys that are no longer used.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Scopes</TableHead><TableHead>Last used</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading API keys...</TableCell></TableRow> : null}
              {!loading && !keys.length ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No API keys yet.</TableCell></TableRow> : null}
              {keys.map((key) => <TableRow key={key.id}><TableCell className="font-medium">{key.name}</TableCell><TableCell className="font-mono text-xs">{key.maskedKey}</TableCell><TableCell><div className="flex max-w-md flex-wrap gap-1">{key.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}</div></TableCell><TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</TableCell><TableCell><Badge variant="outline" className={key.status === "Active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-slate-500/30 bg-slate-500/10 text-slate-600"}>{key.status}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" disabled={key.status !== "Active"} onClick={() => setRevokeKey(key)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(secret)} onOpenChange={(open) => { if (!open) setSecret("") }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Copy your API key now</DialogTitle><DialogDescription>This key will not be shown again. Save it in your backend/server environment.</DialogDescription></DialogHeader>
          <div className="break-all rounded-lg border border-border bg-muted p-4 font-mono text-sm">{secret}</div>
          <DialogFooter><Button type="button" onClick={() => void copyApiKey()}><Copy className="mr-2 h-4 w-4" />Copy key</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revokeKey)} onOpenChange={(open) => { if (!open) setRevokeKey(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoke API key?</DialogTitle><DialogDescription>Requests using this key will stop immediately.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRevokeKey(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={() => void revokeSelectedKey()}>{saving ? "Revoking..." : "Revoke key"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>
}
