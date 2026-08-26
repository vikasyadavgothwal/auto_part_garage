"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LanguageSelector } from "@/components/language/language-selector"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthApiPayload } from "@/lib/auth/types"
import { createFirebaseGoogleLoginPayload, createFirebaseLoginPayload, isFirebaseAuthConfigured } from "@/lib/auth/firebase-client"
import { appPath, appRoutes } from "@/lib/routes"

type Mfa = NonNullable<Extract<AuthApiPayload, { ok: true }>["mfa"]>

export function LoginForm({ branding = { siteName: "AutoPartsPro", logoUrl: "" } }: { branding?: { siteName: string; logoUrl: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(searchParams.get("error") === "owner_disabled" ? "Your account is disabled by your owner." : "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mfa, setMfa] = useState<Mfa | null>(null)
  const [code, setCode] = useState("")

  const finishLogin = () => { router.replace(appRoutes.overview); router.refresh() }

  const handleAuthPayload = (payload: AuthApiPayload) => {
    if (!payload.ok) throw new Error(payload.message)
    if (payload.mfa) { setMfa(payload.mfa); return }
    finishLogin()
  }

  const submitLoginPayload = async (body: Record<string, unknown>) => {
    const response = await fetch(appPath("/api/auth/login"), { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    const payload = (await response.json()) as AuthApiPayload
    if (!response.ok && payload.ok) throw new Error("Unable to sign in.")
    handleAuthPayload(payload)
  }

  const handleGoogleLogin = async () => {
    if (!isFirebaseAuthConfigured()) return setError("Google sign-in is not configured for this dashboard.")
    setError(""); setIsSubmitting(true)
    try {
      const body = await createFirebaseGoogleLoginPayload()
      await submitLoginPayload({ ...body, deviceName: "Garage dashboard" })
    } catch (loginError) {
      setError(loginError instanceof FirebaseError && loginError.code === "auth/popup-closed-by-user" ? "Google sign-in was cancelled." : loginError instanceof Error ? loginError.message : "Unable to sign in with Google.")
    } finally { setIsSubmitting(false) }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true)
    try {
      if (mfa) {
        if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit verification code.")
        const response = await fetch(appPath("/api/auth/login/verify"), { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: mfa.challengeId, code, method: "otp", deviceName: "Garage dashboard" }) })
        const payload = (await response.json()) as AuthApiPayload
        if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Unable to verify login." : payload.message)
        finishLogin(); return
      }
      const normalizedEmail = email.trim().toLowerCase()
      const body = isFirebaseAuthConfigured() ? await createFirebaseLoginPayload(normalizedEmail, password) : { email: normalizedEmail, password, deviceName: "Garage dashboard" }
      await submitLoginPayload(isFirebaseAuthConfigured() ? { ...body, deviceName: "Garage dashboard" } : body)
    } catch (loginError) {
      setError(loginError instanceof FirebaseError && loginError.code === "auth/invalid-credential" ? "The email or password is incorrect." : loginError instanceof Error ? loginError.message : "Unable to sign in.")
    } finally { setIsSubmitting(false) }
  }

  return <div className="flex min-h-svh items-center justify-center bg-brand-surface px-4 py-8 sm:py-10"><div className="w-full max-w-md space-y-3"><div className="flex justify-end"><LanguageSelector /></div><Card className="border border-border bg-brand-elevated text-foreground shadow-2xl shadow-black/20 ring-0"><CardHeader className="space-y-2"><div className="mb-3 flex justify-center">{branding.logoUrl ? <img src={branding.logoUrl} alt={branding.siteName} className="h-16 max-w-[280px] object-contain" /> : <span className="text-2xl font-bold">{branding.siteName}</span>}</div><div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-brand-panel px-3 py-1 text-xs text-brand-muted"><ShieldCheck className="size-3.5" />Secure garage access</div><CardTitle className="text-2xl">{mfa ? "Verify sign in" : "Sign in"}</CardTitle><CardDescription className="text-brand-muted">{mfa ? mfa.message : "Access and refresh tokens are stored in secure HttpOnly cookies."}</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={handleSubmit}>{!mfa ? <><div className="space-y-2"><Label htmlFor="email">Email <span className="text-destructive">*</span></Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="garage@company.com" className="h-11 border-border bg-brand-surface" required /></div><div className="space-y-2"><Label htmlFor="password">Password <span className="text-destructive">*</span></Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={128} placeholder="Enter your password" className="h-11 border-border bg-brand-surface pr-11" required /><Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-brand-muted hover:bg-transparent hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div></> : <div className="space-y-2"><Label htmlFor="code">6-digit OTP <span className="text-destructive">*</span></Label><Input id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" placeholder="Enter 6-digit OTP" className="h-11 border-border bg-brand-surface tracking-[0.35em]" required /></div>}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={isSubmitting} className="h-11 w-full">{isSubmitting ? "Please wait..." : mfa ? "Verify and continue" : "Sign in to dashboard"}</Button>{!mfa && isFirebaseAuthConfigured() ? <Button type="button" variant="outline" disabled={isSubmitting} className="h-11 w-full" onClick={handleGoogleLogin}>Continue with Google</Button> : null}{mfa ? <Button type="button" variant="ghost" className="w-full" onClick={() => { setMfa(null); setCode(""); setError("") }}>Use another account</Button> : null}</form></CardContent></Card></div></div>
}
