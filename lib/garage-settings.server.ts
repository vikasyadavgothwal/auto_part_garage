import { cookies } from "next/headers"

import { requestBackend } from "@/lib/auth/backend"
import {
  emptyGarageProfile,
  type GarageProfileRecord,
} from "@/lib/garage-settings"

type GarageSettingsPayload = {
  ok: boolean
  profile?: GarageProfileRecord
}

export async function getGarageSettings() {
  const response = await requestBackend("/api/v1/garage/settings", {
    cookieHeader: (await cookies()).toString(),
  })

  if (!response.ok) {
    return emptyGarageProfile
  }

  const payload = (await response.json()) as GarageSettingsPayload
  return payload.profile ?? emptyGarageProfile
}
