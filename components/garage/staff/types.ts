type BusinessAccessRecord = {
  businessAccount?: {
    id: string
    isOwner?: boolean
    type?: string
    accountType?: string
    plan?: { name?: string; accountType?: string }
    usage?: {
      staff: number
      roles: number
    }
    limits: {
      staff: number | null
      roles: number | null
    }
  }
  accountType?: string
  permissions?: Array<{
    id: string
    code: string
    name: string
    description: string | null
    menuKey: string | null
    featureKey: string | null
    actionKey: string | null
  }>
  roles?: Array<{
    id: string
    name: string
    description: string | null
    permissionIds: string[]
    isOwnerRole: boolean
  }>
  actions?: Record<
    string,
    {
      allowed: boolean
      reason: string | null
    }
  >
  member?: {
    isOwner: boolean
    roleIds: string[]
    status: string
  }
}

export type BusinessAccessPayload = {
  ok: boolean
  access?: BusinessAccessRecord[]
}

export type BusinessAccessEntry = NonNullable<BusinessAccessPayload["access"]>[number] | null

export type MembersResponse = {
  ok: boolean
  members?: Array<{
    id: string
    userId: string
    status: string
    roleIds: string[]
    user: {
      id?: string
      publicId?: string | null
      name: string | null
      firstName?: string | null
      lastName?: string | null
      email: string | null
      phone: string | null
    }
    joinedAt: string | null
    createdAt: string
  }>
  invitations?: Array<{
    id: string
    email: string
    roleIds: string[]
    status: string
    createdAt: string
    expiresAt: string
  }>
}

export type RolesResponse = {
  ok: boolean
  roles?: Array<{
    id: string
    name: string
    description: string | null
    isOwnerRole: boolean
    permissionIds: string[]
  }>
}

export type PermissionsResponse = {
  ok: boolean
  permissions?: Array<{
    id: string
    code: string
    name: string
    description: string | null
    menuKey: string | null
    featureKey: string | null
    actionKey: string | null
    isSystem: boolean
  }>
}

export const canInviteMembers = (
  access: BusinessAccessEntry | undefined,
) => {
  if (!access) return false
  const action = access.actions?.["staff.invite"]
  if (action?.allowed !== undefined) {
    return action.allowed
  }
  return false
}

export const canCreateRoles = (
  access: BusinessAccessEntry | undefined,
) => {
  if (!access) return false
  const action = access.actions?.["roles.create"]
  if (action?.allowed !== undefined) {
    return action.allowed
  }
  return false
}

export const toDisplayName = (value: string | null | undefined) => value?.trim() || "—"
