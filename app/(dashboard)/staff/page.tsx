import { cookies } from "next/headers"

import { GarageStaffPage } from "@/components/garage/staff/staff-page"
import {
  type BusinessAccessEntry,
  type BusinessAccessPayload,
  type MembersResponse,
  type RolesResponse,
} from "@/components/garage/staff/types"
import { requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function getBusinessAccess(cookieHeader: string) {
  const response = await requestBackend("/api/v1/business/access", { cookieHeader }).catch(() => null)
  if (!response?.ok) return null
  const payload = (await response.json()) as BusinessAccessPayload
  return payload.access?.find((item) => {
    const accountType =
      item?.businessAccount?.type ??
      item?.businessAccount?.accountType ??
      item?.accountType ??
      item?.businessAccount?.plan?.accountType
    return accountType === "Garage"
  }) as BusinessAccessEntry
}

async function getMembers(cookieHeader: string, businessAccountId: string): Promise<MembersResponse> {
  const response = await requestBackend(`/api/v1/business/members?businessAccountId=${encodeURIComponent(businessAccountId)}`, {
    cookieHeader,
  }).catch(() => null)
  if (!response?.ok) return { ok: false }
  const payload = (await response.json()) as MembersResponse & { members?: MembersResponse }
  return Array.isArray(payload.members) ? payload : { ok: payload.ok, ...(payload.members ?? {}) }
}

async function getRoles(cookieHeader: string, businessAccountId: string): Promise<RolesResponse> {
  const response = await requestBackend(`/api/v1/business/roles?businessAccountId=${encodeURIComponent(businessAccountId)}`, {
    cookieHeader,
  }).catch(() => null)
  if (!response?.ok) return { ok: false }
  return (await response.json()) as RolesResponse
}

export default async function GarageStaffPageRoute() {
  const cookieHeader = (await cookies()).toString()
  const access = await getBusinessAccess(cookieHeader)
  const businessAccountId = access?.businessAccount?.id

  const [membersPayload, rolesPayload] = await Promise.all([
    businessAccountId ? getMembers(cookieHeader, businessAccountId) : { ok: false },
    businessAccountId ? getRoles(cookieHeader, businessAccountId) : { ok: false },
  ])

  return <GarageStaffPage access={access} membersPayload={membersPayload} rolesPayload={rolesPayload} />
}
