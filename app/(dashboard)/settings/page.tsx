import { cookies } from "next/headers"

import { ChangePasswordCard } from "@/components/garage/settings/change-password-card"
import { SettingsManager } from "@/components/garage/settings/settings-manager"
import { AccountSettingsCard } from "@/components/shared/account-settings-card"
import { LoginSecurityCard } from "@/components/shared/login-security-card"
import { requestBackend } from "@/lib/auth/backend"
import { getGarageSettings } from "@/lib/garage-settings.server"

type BusinessAccessPayload = {
  ok: boolean
  access?: Array<{ businessAccount: { type: string; isOwner?: boolean } }>
}

type AccountPayload = {
  ok: boolean
  account?: { firstName: string | null; lastName: string | null; email: string | null }
}

async function getSettingsContext() {
  const cookieHeader = (await cookies()).toString()
  const [accessResponse, accountResponse] = await Promise.all([
    requestBackend("/api/v1/business/access", { cookieHeader }).catch(() => null),
    requestBackend("/api/v1/user/account", { cookieHeader }).catch(() => null),
  ])
  const accessPayload = accessResponse?.ok ? ((await accessResponse.json()) as BusinessAccessPayload) : null
  const accountPayload = accountResponse?.ok ? ((await accountResponse.json()) as AccountPayload) : null
  return {
    isOwner: Boolean(accessPayload?.access?.find((item) => item.businessAccount.type === "Garage")?.businessAccount.isOwner),
    account: accountPayload?.account ?? null,
  }
}

export default async function SettingsPage() {
  const context = await getSettingsContext()
  const profile = context.isOwner ? await getGarageSettings() : null
  return (
    <div className="space-y-8">
      {profile ? <SettingsManager profile={profile} /> : null}
      <AccountSettingsCard initialAccount={context.account} />
      <LoginSecurityCard />
      <ChangePasswordCard />
    </div>
  )
}
