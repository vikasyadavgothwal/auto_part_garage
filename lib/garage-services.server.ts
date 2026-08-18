import { cookies } from "next/headers"

import { requestBackend } from "@/lib/auth/backend"
import {
  formatGarageService,
  type GarageServiceRecord,
} from "@/lib/garage-services"
import { tablePageSize, type PaginationMeta } from "@/lib/pagination"

type GarageServicesPayload = {
  ok: boolean
  services?: GarageServiceRecord[]
  pagination?: PaginationMeta
  message?: string
}

export async function getGarageServices() {
  const response = await requestBackend("/api/v1/garage/services?all=1", {
    cookieHeader: (await cookies()).toString(),
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as GarageServicesPayload
  return (payload.services ?? []).map(formatGarageService)
}

export async function getGarageServicesPage(page: number) {
  const response = await requestBackend(
    `/api/v1/garage/services?page=${page}&pageSize=${tablePageSize}`,
    {
      cookieHeader: (await cookies()).toString(),
    },
  )

  if (!response.ok) {
    return {
      services: [],
      pagination: { page, pageSize: tablePageSize, total: 0, totalPages: 1 },
    }
  }

  const payload = (await response.json()) as GarageServicesPayload
  return {
    services: (payload.services ?? []).map(formatGarageService),
    pagination:
      payload.pagination ??
      { page, pageSize: tablePageSize, total: 0, totalPages: 1 },
  }
}
