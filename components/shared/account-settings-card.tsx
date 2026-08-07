"use client"

import { useEffect, useState, type FormEvent } from "react"
import { UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

type Account = {
  firstName: string | null
  lastName: string | null
  email: string | null
}

type AccountResponse = {
  ok?: boolean
  account?: Account
  message?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AccountSettingsCard({ initialAccount }: { initialAccount?: Account | null }) {
  const [form, setForm] = useState({
    firstName: initialAccount?.firstName ?? "",
    lastName: initialAccount?.lastName ?? "",
    email: initialAccount?.email ?? "",
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialAccount) return
    let active = true
    authenticatedFetch(appPath("/api/account"))
      .then((response) => response.json() as Promise<AccountResponse>)
      .then((payload) => {
        if (!active || !payload.account) return
        setForm({
          firstName: payload.account.firstName ?? "",
          lastName: payload.account.lastName ?? "",
          email: payload.account.email ?? "",
        })
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [initialAccount])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim().toLowerCase()
    setMessage(null)
    setError(null)
    if (!firstName) return setError("First name is required.")
    if (!lastName) return setError("Last name is required.")
    if (!email || email.length > 254 || !emailPattern.test(email)) return setError("Enter a valid email address.")

    setIsSaving(true)
    try {
      const response = await authenticatedFetch(appPath("/api/account"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      })
      const payload = (await response.json().catch(() => null)) as AccountResponse | null
      if (!response.ok || !payload?.ok || !payload.account) {
        throw new Error(payload?.message || "Unable to update account.")
      }
      setForm({
        firstName: payload.account.firstName ?? "",
        lastName: payload.account.lastName ?? "",
        email: payload.account.email ?? "",
      })
      setMessage("Account updated successfully.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update account.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-sm border border-border bg-brand-panel shadow-none">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="account-first-name">First Name</Label>
            <Input id="account-first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} maxLength={100} className="border-border bg-brand-surface" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-last-name">Last Name</Label>
            <Input id="account-last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} maxLength={100} className="border-border bg-brand-surface" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} className="border-border bg-brand-surface" />
          </div>
          {error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-500 md:col-span-3">{message}</p> : null}
          <div className="md:col-span-3">
            <Button type="submit" disabled={isSaving} className="gap-2">
              <UserRound className="size-4" />
              {isSaving ? "Saving..." : "Save Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
