"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import { appPath } from "@/lib/routes"

export function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [isSaving, setIsSaving] = useState(false)

  const submit = async () => {
    if (!form.currentPassword) return toast.error("Current password is required")
    if (form.newPassword.length < 8 || form.newPassword.length > 128) {
      return toast.error("New password must be between 8 and 128 characters")
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("New passwords do not match")
    }
    setIsSaving(true)
    try {
      const response = await authenticatedFetch(appPath("/api/auth/change-password"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      })
      const payload = (await response.json()) as { ok?: boolean; message?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Unable to change password")
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success(payload.message || "Password changed successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-sm border border-border bg-brand-panel shadow-none">
      <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {(["currentPassword", "newPassword", "confirmPassword"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`password-${key}`}>{key === "currentPassword" ? "Current Password" : key === "newPassword" ? "New Password" : "Confirm Password"} <span className="text-destructive">*</span></Label>
            <Input id={`password-${key}`} type="password" autoComplete={key === "currentPassword" ? "current-password" : "new-password"} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} minLength={key === "currentPassword" ? undefined : 8} maxLength={128} required className="border-border bg-brand-surface" />
          </div>
        ))}
        <div className="md:col-span-3"><Button type="button" disabled={isSaving} onClick={submit} className="gap-2 bg-primary text-primary-foreground hover:bg-brand-primary-hover"><KeyRound className="size-4" />{isSaving ? "Changing..." : "Change Password"}</Button></div>
      </CardContent>
    </Card>
  )
}
