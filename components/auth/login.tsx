"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff, ShieldCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthApiPayload } from "@/lib/auth/types"
import { createFirebaseLoginPayload, isFirebaseAuthConfigured } from "@/lib/auth/firebase-client"
import { appPath, appRoutes } from "@/lib/routes"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const body = isFirebaseAuthConfigured()
        ? await createFirebaseLoginPayload(normalizedEmail, password)
        : { email: normalizedEmail, password, deviceName: "Garage dashboard" }
      const response = await fetch(appPath("/api/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = (await response.json()) as AuthApiPayload

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unable to sign in." : payload.message)
      }

      router.replace(appRoutes.overview)
      router.refresh()
    } catch (loginError) {
      setError(
        loginError instanceof FirebaseError && loginError.code === "auth/invalid-credential"
          ? "The email or password is incorrect."
          : loginError instanceof Error
            ? loginError.message
            : "Unable to sign in.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-surface px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_420px]">
        <section className="rounded-3xl border border-border bg-brand-elevated p-8 text-foreground lg:p-10">
          <div className="surface-pill mb-6 bg-primary/15 text-brand-primary-soft">
            <Truck className="size-4" />
            Garage Operations Control
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
            Keep service bookings, schedules, and customer activity in one dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted">
            AutoPartsPro gives garage teams a secure workspace for bookings, services,
            reviews, and daily operations.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-brand-panel p-4">
              <div className="text-2xl font-semibold">128</div>
              <p className="mt-1 text-sm text-brand-muted">Bookings managed</p>
            </div>
            <div className="rounded-2xl border border-border bg-brand-panel p-4">
              <div className="text-2xl font-semibold">24</div>
              <p className="mt-1 text-sm text-brand-muted">Services scheduled</p>
            </div>
            <div className="rounded-2xl border border-border bg-brand-panel p-4">
              <div className="text-2xl font-semibold">96.2%</div>
              <p className="mt-1 text-sm text-brand-muted">Customer satisfaction</p>
            </div>
          </div>
        </section>

        <Card className="border border-border bg-brand-elevated text-foreground ring-0">
          <CardHeader className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-brand-panel px-3 py-1 text-xs text-brand-muted">
              <ShieldCheck className="size-3.5" />
              Secure garage access
            </div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription className="text-brand-muted">
              Access and refresh tokens are stored in secure HttpOnly cookies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="garage@company.com"
                  className="h-11 border-border bg-brand-surface"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 border-border bg-brand-surface pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-brand-muted hover:bg-transparent hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
                {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
