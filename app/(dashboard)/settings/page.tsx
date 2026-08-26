import { cookies } from "next/headers"

import { ChangePasswordCard } from "@/components/garage/settings/change-password-card"
import { SettingsManager } from "@/components/garage/settings/settings-manager"
import { AccountSettingsCard } from "@/components/shared/account-settings-card"
import { requestBackend } from "@/lib/auth/backend"
import { requireGarageUser } from "@/lib/auth/server"
import { getGarageSettings } from "@/lib/garage-settings.server"

type BusinessAccessPayload = {
  ok: boolean
  access?: Array<{ businessAccount: { type: string; isOwner?: boolean } }>
}

async function getSettingsContext() {
  const cookieHeader = (await cookies()).toString()
  const accessResponse = await requestBackend("/api/v1/business/access", { cookieHeader }).catch(() => null)
  const accessPayload = accessResponse?.ok ? ((await accessResponse.json()) as BusinessAccessPayload) : null
  const account = accessPayload?.access?.find((item) => item.businessAccount.type === "Garage")
  return {
    hasBusinessAccess: Boolean(account),
  }
}

export default async function SettingsPage() {
  const [user, context] = await Promise.all([
    requireGarageUser(),
    getSettingsContext(),
  ])
  const profile = context.hasBusinessAccess ? await getGarageSettings() : null

  if (profile) {
    return (
      <div className="space-y-8">
        <SettingsManager profile={profile} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AccountSettingsCard
        initialAccount={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }}
        allowEmail={false}
      />
      <ChangePasswordCard />
    </div>
  )
}
