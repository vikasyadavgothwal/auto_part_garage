"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"

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
    <div className="flex min-h-svh items-center justify-center bg-brand-surface px-4 py-8 sm:py-10">
      <div className="w-full max-w-md">
        <Card className="border border-border bg-brand-elevated text-foreground shadow-2xl shadow-black/20 ring-0">
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
