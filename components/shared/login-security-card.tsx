"use client"

import { useEffect, useState, type FormEvent } from "react"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

type Status = { enterprise: boolean; hasPin: boolean }

export function LoginSecurityCard() {
  const [status, setStatus] = useState<Status | null>(null)
  const [pin, setPin] = useState("")
  const [otp, setOtp] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    authenticatedFetch(appPath("/api/business/login-security"))
      .then((response) => response.json() as Promise<{ ok?: boolean; security?: Status }>)
      .then((payload) => setStatus(payload.security ?? { enterprise: false, hasPin: false }))
      .catch(() => setStatus({ enterprise: false, hasPin: false }))
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(null); setError(null)
    if (!/^\d{6}$/.test(pin)) return setError("PIN must be exactly 6 digits.")
    if (!/^\d{6}$/.test(otp)) return setError("OTP must be exactly 6 digits.")
    setPending(true)
    try {
      const response = await authenticatedFetch(appPath("/api/business/login-security"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save-pin", pin, otp }) })
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null
      if (!response.ok || !payload?.ok) throw new Error(payload?.message || "Unable to save PIN")
      setStatus({ enterprise: true, hasPin: true }); setPin(""); setOtp(""); setMessage(payload.message || "PIN saved successfully")
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save PIN") } finally { setPending(false) }
  }

  return <Card className="rounded-sm border border-border bg-brand-panel shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Enterprise login PIN</CardTitle><CardDescription>{status.hasPin ? "Update your 6-digit PIN. OTP verification is required before saving changes." : "Create a 6-digit PIN for Enterprise login. You can also continue to use email OTP."}</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="grid gap-5 md:grid-cols-3"><div className="space-y-2"><Label htmlFor="login-pin">New 6-digit PIN</Label><Input id="login-pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} className="border-border bg-brand-surface tracking-[0.35em]" /></div><div className="space-y-2"><Label htmlFor="login-pin-otp">Email OTP</Label><Input id="login-pin-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="border-border bg-brand-surface tracking-[0.35em]" /></div><div className="flex items-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={requestOtp}>Send OTP</Button><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save PIN"}</Button></div>{error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}{message ? <p className="text-sm text-emerald-500 md:col-span-3">{message}</p> : null}</form></CardContent></Card>
}
