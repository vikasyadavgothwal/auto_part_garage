import { cookies } from "next/headers"

import { GarageRolesPage } from "@/components/garage/staff/roles-page"
import {
  type BusinessAccessEntry,
  type BusinessAccessPayload,
  type PermissionsResponse,
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

async function getRoles(cookieHeader: string, businessAccountId: string): Promise<RolesResponse> {
  const response = await requestBackend(`/api/v1/business/roles?businessAccountId=${encodeURIComponent(businessAccountId)}`, {
    cookieHeader,
  }).catch(() => null)
  if (!response?.ok) return { ok: false }
  return (await response.json()) as RolesResponse
}

async function getPermissions(cookieHeader: string, businessAccountId: string): Promise<PermissionsResponse> {
  const response = await requestBackend(`/api/v1/business/permissions?businessAccountId=${encodeURIComponent(businessAccountId)}`, {
    cookieHeader,
  }).catch(() => null)
  if (!response?.ok) return { ok: false }
  return (await response.json()) as PermissionsResponse
}

function fallbackRoles(access: BusinessAccessEntry | undefined): RolesResponse {
  return {
    ok: true,
    roles: (access?.roles ?? []).map((role: {
      id: string
      name: string
      description: string | null
      isOwnerRole: boolean
      permissionIds: string[]
    }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isOwnerRole: role.isOwnerRole,
      permissionIds: role.permissionIds,
    })) ?? [],
  }
}

export default async function GarageRolesPageRoute() {
  const cookieHeader = (await cookies()).toString()
  const access = await getBusinessAccess(cookieHeader)
  const businessAccountId = access?.businessAccount?.id

  const [rolesPayload, permissionsPayload] = await Promise.all([
    businessAccountId ? getRoles(cookieHeader, businessAccountId) : fallbackRoles(access),
    businessAccountId ? getPermissions(cookieHeader, businessAccountId) : { ok: false },
  ])

  return (
    <GarageRolesPage
      access={access}
      rolesPayload={rolesPayload.ok ? rolesPayload : fallbackRoles(access)}
      permissionsPayload={permissionsPayload.ok ? permissionsPayload : { ok: false, permissions: [] }}
    />
  )
}
