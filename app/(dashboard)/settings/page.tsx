import { ChangePasswordCard } from "@/components/garage/settings/change-password-card"
import { SettingsManager } from "@/components/garage/settings/settings-manager"
import { getGarageSettings } from "@/lib/garage-settings.server"

export default async function SettingsPage() {
  const profile = await getGarageSettings()
  return (
    <div className="space-y-8">
      <SettingsManager profile={profile} />
      <ChangePasswordCard />
    </div>
  )
}
