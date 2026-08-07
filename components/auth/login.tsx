"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthApiPayload } from "@/lib/auth/types"
import { createFirebaseLoginPayload, isFirebaseAuthConfigured } from "@/lib/auth/firebase-client"
import { appPath, appRoutes } from "@/lib/routes"

type Mfa = NonNullable<Extract<AuthApiPayload, { ok: true }>["mfa"]>

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mfa, setMfa] = useState<Mfa | null>(null)
  const [code, setCode] = useState("")
  const [method, setMethod] = useState<"otp" | "pin">("otp")

  const finishLogin = () => { router.replace(appRoutes.overview); router.refresh() }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true)
    try {
      if (mfa) {
        const response = await fetch(appPath("/api/auth/login/verify"), { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: mfa.challengeId, code, method, deviceName: "Garage dashboard" }) })
        const payload = (await response.json()) as AuthApiPayload
        if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Unable to verify login." : payload.message)
        finishLogin(); return
      }
      const normalizedEmail = email.trim().toLowerCase()
      const body = isFirebaseAuthConfigured() ? await createFirebaseLoginPayload(normalizedEmail, password) : { email: normalizedEmail, password, deviceName: "Garage dashboard" }
      const response = await fetch(appPath("/api/auth/login"), { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const payload = (await response.json()) as AuthApiPayload
      if (!response.ok || !payload.ok) throw new Error(payload.ok ? "Unable to sign in." : payload.message)
      if (payload.mfa) { setMfa(payload.mfa); setMethod(payload.mfa.method === "pin_or_otp" && payload.mfa.hasPin ? "pin" : "otp"); return }
      finishLogin()
    } catch (loginError) {
      setError(loginError instanceof FirebaseError && loginError.code === "auth/invalid-credential" ? "The email or password is incorrect." : loginError instanceof Error ? loginError.message : "Unable to sign in.")
    } finally { setIsSubmitting(false) }
  }

  return <div className="flex min-h-svh items-center justify-center bg-brand-surface px-4 py-8 sm:py-10"><div className="w-full max-w-md"><Card className="border border-border bg-brand-elevated text-foreground shadow-2xl shadow-black/20 ring-0"><CardHeader className="space-y-2"><div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-brand-panel px-3 py-1 text-xs text-brand-muted"><ShieldCheck className="size-3.5" />Secure garage access</div><CardTitle className="text-2xl">{mfa ? "Verify sign in" : "Sign in"}</CardTitle><CardDescription className="text-brand-muted">{mfa ? mfa.message : "Access and refresh tokens are stored in secure HttpOnly cookies."}</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={handleSubmit}>{!mfa ? <><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="garage@company.com" className="h-11 border-border bg-brand-surface" required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 border-border bg-brand-surface pr-11" required /><Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-brand-muted hover:bg-transparent hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></div></> : <><div className="grid grid-cols-2 gap-2">{mfa.method === "pin_or_otp" && mfa.hasPin ? <Button type="button" variant={method === "pin" ? "default" : "outline"} onClick={() => setMethod("pin")}>Use PIN</Button> : null}<Button type="button" variant={method === "otp" ? "default" : "outline"} onClick={() => setMethod("otp")}>Use OTP</Button></div><div className="space-y-2"><Label htmlFor="code">6-digit {method === "pin" ? "PIN" : "OTP"}</Label><Input id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-11 border-border bg-brand-surface tracking-[0.35em]" required /></div></>}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={isSubmitting} className="h-11 w-full">{isSubmitting ? "Please wait..." : mfa ? "Verify and continue" : "Sign in to dashboard"}</Button>{mfa ? <Button type="button" variant="ghost" className="w-full" onClick={() => { setMfa(null); setCode(""); setError("") }}>Use another account</Button> : null}</form></CardContent></Card></div></div>
}
