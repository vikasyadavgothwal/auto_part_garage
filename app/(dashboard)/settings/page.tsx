import { SettingsManager } from "@/components/garage/settings/settings-manager"
import { getGarageSettings } from "@/lib/garage-settings.server"

export default async function SettingsPage() {
  const profile = await getGarageSettings()
  return <SettingsManager profile={profile} />
}
