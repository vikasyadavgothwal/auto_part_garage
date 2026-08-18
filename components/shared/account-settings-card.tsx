"use client"

import { useEffect, useState, type FormEvent } from "react"
import { UserRound } from "lucide-react"
import { toast } from "sonner"

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

export function AccountSettingsCard({
  initialAccount,
  allowEmail = true,
}: {
  initialAccount?: Account | null
  allowEmail?: boolean
}) {
  const [form, setForm] = useState({
    firstName: initialAccount?.firstName ?? "",
    lastName: initialAccount?.lastName ?? "",
    email: initialAccount?.email ?? "",
  })
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
    if (!firstName || firstName.length > 100) return toast.error("First name is required and must be 100 characters or fewer.")
    if (!lastName || lastName.length > 100) return toast.error("Last name is required and must be 100 characters or fewer.")
    if (allowEmail && (!email || email.length > 254 || !emailPattern.test(email))) return toast.error("Enter a valid email address.")

    setIsSaving(true)
    try {
      const response = await authenticatedFetch(appPath("/api/account"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          ...(allowEmail ? { email } : {}),
        }),
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
      toast.success("Account updated successfully.")
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to update account.")
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
            <Label htmlFor="account-first-name">First Name <span className="text-destructive">*</span></Label>
            <Input id="account-first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} maxLength={100} required className="border-border bg-brand-surface" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-last-name">Last Name <span className="text-destructive">*</span></Label>
            <Input id="account-last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} maxLength={100} required className="border-border bg-brand-surface" />
          </div>
          {allowEmail ? (
            <div className="space-y-2">
              <Label htmlFor="account-email">Email <span className="text-destructive">*</span></Label>
              <Input id="account-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} required className="border-border bg-brand-surface" />
            </div>
          ) : null}
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
