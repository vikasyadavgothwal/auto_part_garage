import { cookies } from "next/headers"

import { requestBackend } from "@/lib/auth/backend"
import {
  formatGarageService,
  type GarageServiceRecord,
} from "@/lib/garage-services"

type GarageServicesPayload = {
  ok: boolean
  services?: GarageServiceRecord[]
  message?: string
}

export async function getGarageServices() {
  const response = await requestBackend("/api/v1/garage/services", {
    cookieHeader: (await cookies()).toString(),
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as GarageServicesPayload
  return (payload.services ?? []).map(formatGarageService)
}
