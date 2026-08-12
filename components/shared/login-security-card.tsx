"use client"

import { useEffect, useState, type FormEvent } from "react"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

type StaffLoginMethod = "any" | "google" | "password"
type Status = { enterprise: boolean; hasPin: boolean; businessAccountId?: string; staffLoginMethod?: StaffLoginMethod; canManageStaffLoginPolicy?: boolean }

const fallbackStatus: Status = { enterprise: false, hasPin: false, staffLoginMethod: "any", canManageStaffLoginPolicy: false }
const staffLoginOptions: Array<{ value: StaffLoginMethod; label: string; description: string }> = [
  { value: "any", label: "Any method", description: "Staff can use Google or password sign-in." },
  { value: "google", label: "Google only", description: "Staff must sign in with Google, then complete OTP." },
  { value: "password", label: "Password only", description: "Staff must sign in with email/password, then complete OTP." },
]

export function LoginSecurityCard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [staffLoginMethod, setStaffLoginMethod] = useState<StaffLoginMethod>("any")
  const [pin, setPin] = useState("")
  const [otp, setOtp] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    authenticatedFetch(appPath("/api/business/login-security"))
      .then((response) => response.json() as Promise<{ ok?: boolean; security?: Status }>)
      .then((payload) => {
        const security = payload.security ?? fallbackStatus
        setStatus(security)
        setStaffLoginMethod(security.staffLoginMethod ?? "any")
      })
      .catch(() => { setStatus(fallbackStatus); setStaffLoginMethod("any") })
  }, [])

  if (!status?.enterprise) return null

  const requestOtp = async () => {
    setPending(true); setMessage(null); setError(null)
    try {
      const response = await authenticatedFetch(appPath("/api/business/login-security"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "request-pin-otp" }) })
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null
      if (!response.ok || !payload?.ok) throw new Error(payload?.message || "Unable to send OTP")
      setMessage(payload.message || "OTP sent to your email")
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Unable to send OTP") } finally { setPending(false) }
  }

  const saveStaffLoginMethod = async () => {
    setPending(true); setMessage(null); setError(null)
    try {
      const response = await authenticatedFetch(appPath("/api/business/login-security"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save-staff-login-method", businessAccountId: status.businessAccountId, staffLoginMethod }) })
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string; staffLoginMethod?: StaffLoginMethod } | null
      if (!response.ok || !payload?.ok) throw new Error(payload?.message || "Unable to save staff login policy")
      const savedMethod = payload.staffLoginMethod ?? staffLoginMethod
      setStaffLoginMethod(savedMethod)
      setStatus((current) => current ? { ...current, staffLoginMethod: savedMethod } : current)
      setMessage(payload.message || "Staff login policy saved")
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save staff login policy") } finally { setPending(false) }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(null); setError(null)
    if (!/^\d{6}$/.test(pin)) return setError("PIN must be exactly 6 digits.")
    if (!/^\d{6}$/.test(otp)) return setError("OTP must be exactly 6 digits.")
    setPending(true)
    try {
      const response = await authenticatedFetch(appPath("/api/business/login-security"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save-pin", pin, otp }) })
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null
      if (!response.ok || !payload?.ok) throw new Error(payload?.message || "Unable to save PIN")
      setStatus((current) => current ? { ...current, hasPin: true } : { ...fallbackStatus, enterprise: true, hasPin: true }); setPin(""); setOtp(""); setMessage(payload.message || "PIN saved successfully")
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save PIN") } finally { setPending(false) }
  }

  return <Card className="rounded-sm border border-border bg-brand-panel shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Enterprise login security</CardTitle><CardDescription>{status.hasPin ? "Update your 6-digit PIN. OTP verification is required before saving changes." : "Enterprise users verify with email OTP after sign-in. You can also create a 6-digit PIN."}</CardDescription></CardHeader><CardContent className="space-y-6">{status.canManageStaffLoginPolicy ? <section className="space-y-3 rounded-md border border-border bg-brand-surface p-4"><div><h3 className="text-sm font-medium text-foreground">Staff login method</h3><p className="text-sm text-brand-muted">Choose how staff must complete the first sign-in step. Enterprise staff still verify with OTP after this.</p></div><div className="grid gap-2 md:grid-cols-3">{staffLoginOptions.map((option) => <Button key={option.value} type="button" variant={staffLoginMethod === option.value ? "default" : "outline"} className="h-auto justify-start whitespace-normal p-3 text-left" onClick={() => setStaffLoginMethod(option.value)}><span><span className="block font-medium">{option.label}</span><span className="block text-xs opacity-80">{option.description}</span></span></Button>)}</div><Button type="button" disabled={pending} onClick={saveStaffLoginMethod}>{pending ? "Saving..." : "Save staff login policy"}</Button></section> : null}<form onSubmit={submit} className="grid gap-5 md:grid-cols-3"><div className="space-y-2"><Label htmlFor="login-pin">New 6-digit PIN</Label><Input id="login-pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} className="border-border bg-brand-surface tracking-[0.35em]" /></div><div className="space-y-2"><Label htmlFor="login-pin-otp">Email OTP</Label><Input id="login-pin-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="border-border bg-brand-surface tracking-[0.35em]" /></div><div className="flex items-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={requestOtp}>Send OTP</Button><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save PIN"}</Button></div>{error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}{message ? <p className="text-sm text-emerald-500 md:col-span-3">{message}</p> : null}</form></CardContent></Card>
}
