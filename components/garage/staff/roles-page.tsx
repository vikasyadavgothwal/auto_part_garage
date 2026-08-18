"use client"

import { useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, Pencil, Search, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  canCreateRoles,
  toDisplayName,
  type BusinessAccessEntry,
  type PermissionsResponse,
  type RolesResponse,
} from "./types"

type PermissionItem = {
  id: string
  name: string
  code: string
  description: string | null
}

type RoleItem = {
  id: string
  name: string
  description: string | null
  isOwnerRole: boolean
  permissionIds: string[]
}

const roleNamePattern = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/

function statusText(access: BusinessAccessEntry | undefined) {
  const action = access?.actions?.["roles.create"]
  if (action && action.allowed === false) {
    return action.reason || "Role creation is unavailable for this plan."
  }
  if (access && !access.actions?.["roles.create"]?.allowed) {
    return "You do not have permission to manage roles."
  }
  return null
}

function permissionNames(permissionIds: string[], permissions: PermissionItem[]) {
  const map = new Map(permissions.map((item) => [item.id, item]))
  return permissionIds
    .map((id) => map.get(id)?.name ?? "Permission")
    .slice(0, 6)
    .join(", ")
}

function selectedPermissionEntries(
  selectedPermissionIds: string[],
  permissions: PermissionItem[],
) {
  const map = new Map(permissions.map((item) => [item.id, item]))
  return selectedPermissionIds.map((id) => map.get(id)).filter((item): item is PermissionItem => Boolean(item))
}

export function GarageRolesPage({
  access,
  rolesPayload,
  permissionsPayload,
}: {
  access: BusinessAccessEntry | undefined
  rolesPayload: RolesResponse
  permissionsPayload: PermissionsResponse
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [permissionQuery, setPermissionQuery] = useState("")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null)
  const router = useRouter()

  const canCreate = canCreateRoles(access)
  const canMutateRoles = canCreate
  const roleMessage = statusText(access)
  const roles = useMemo<RoleItem[]>(() => rolesPayload.roles ?? [], [rolesPayload.roles])
  const permissions = useMemo<PermissionItem[]>(
    () =>
      (permissionsPayload.permissions ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description,
      })),
    [permissionsPayload.permissions],
  )

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return true
        const rolePermissions = permissionNames(role.permissionIds, permissions)
        const haystack = `${role.name} ${toDisplayName(role.description)} ${rolePermissions} ${role.isOwnerRole ? "owner" : ""}`.toLowerCase()
        return haystack.includes(q)
      }),
    [roles, permissions, searchQuery],
  )

  const filteredPermissions = useMemo(() => {
    const q = permissionQuery.trim().toLowerCase()
    if (!q) return permissions
    return permissions.filter((permission) =>
      `${permission.name} ${permission.code} ${permission.description ?? ""}`.toLowerCase().includes(q),
    )
  }, [permissions, permissionQuery])

  const limitText =
    access?.businessAccount?.limits?.roles == null
      ? "Unlimited"
      : `${access?.businessAccount?.usage?.roles ?? 0}/${access?.businessAccount?.limits?.roles}`

  const closeEditDialog = () => {
    setIsEditOpen(false)
    setEditingRole(null)
    setName("")
    setDescription("")
    setSelectedPermissionIds([])
    setPermissionQuery("")
  }

  const openCreateDialog = () => {
    setEditingRole(null)
    setName("")
    setDescription("")
    setSelectedPermissionIds([])
    setPermissionQuery("")
    setMessage(null)
    setIsEditOpen(true)
  }

  const openEditDialog = (role: RoleItem) => {
    setEditingRole(role)
    setName(role.name)
    setDescription(role.description ?? "")
    setSelectedPermissionIds(role.permissionIds)
    setPermissionQuery("")
    setMessage(null)
    setIsEditOpen(true)
  }

  const openDeleteDialog = (role: RoleItem) => {
    setDeletingRole(role)
    setIsDeleteOpen(true)
  }

  const createRole = async () => {
    if (!canMutateRoles || !access?.businessAccount?.id) {
      const unableMessage = roleMessage || "Role creation is not available."
      setMessage(unableMessage)
      toast.error(unableMessage)
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch("/api/business/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessAccountId: access.businessAccount?.id,
          name: name.trim(),
          description: description.trim(),
          permissionIds: selectedPermissionIds,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const errorMessage =
          (payload && (payload.message ?? payload.error)) || "Unable to create role."
        setMessage(errorMessage)
        toast.error(errorMessage)
      } else {
        toast.success("Role created")
        closeEditDialog()
        router.refresh()
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to create role."
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const updateRole = async () => {
    if (!editingRole || !access?.businessAccount?.id) {
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const response = await fetch(
        `/api/business/roles/${encodeURIComponent(editingRole.id)}?businessAccountId=${encodeURIComponent(access.businessAccount.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            permissionIds: selectedPermissionIds,
          }),
        },
      )
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const errorMessage =
          (payload && (payload.message ?? payload.error)) || "Unable to update role."
        setMessage(errorMessage)
        toast.error(errorMessage)
      } else {
        toast.success("Role updated")
        closeEditDialog()
        router.refresh()
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to update role."
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRole = async () => {
    if (!deletingRole || !access?.businessAccount?.id) return

    setSubmitting(true)
    try {
      const response = await fetch(
        `/api/business/roles/${encodeURIComponent(deletingRole.id)}?businessAccountId=${encodeURIComponent(access.businessAccount.id)}`,
        {
          method: "DELETE",
        },
      )
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const errorMessage =
          (payload && (payload.message ?? payload.error)) || "Unable to delete role."
        toast.error(errorMessage)
      } else {
        toast.success("Role deleted")
        setIsDeleteOpen(false)
        setDeletingRole(null)
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete role.")
    } finally {
      setSubmitting(false)
    }
  }

  const submitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canMutateRoles) {
      const unableMessage = roleMessage || "Role management is not available."
      setMessage(unableMessage)
      toast.error(unableMessage)
      return
    }
    const normalizedName = name.trim()
    if (normalizedName.length < 2 || normalizedName.length > 80 || !roleNamePattern.test(normalizedName)) {
      const errorMessage = "Role name must be 2 to 80 characters and use letters, numbers, spaces, hyphens, or underscores only."
      setMessage(errorMessage)
      toast.error(errorMessage)
      return
    }
    if (description.trim().length > 500) {
      const errorMessage = "Role description must be 500 characters or fewer."
      setMessage(errorMessage)
      toast.error(errorMessage)
      return
    }
    if (!selectedPermissionIds.length) {
      const errorMessage = "Select at least one permission for this role."
      setMessage(errorMessage)
      toast.error(errorMessage)
      return
    }
    if (editingRole) {
      await updateRole()
    } else {
      await createRole()
    }
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((previous) =>
      previous.includes(permissionId)
        ? previous.filter((id) => id !== permissionId)
        : [...previous, permissionId],
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Roles</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">Create, edit, and assign role permissions for your team.</p>
        <p className="mt-2 text-xs text-muted-foreground">Role limit: {limitText}</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Existing roles</h2>
          <Button type="button" onClick={openCreateDialog} disabled={!canMutateRoles}>
            New role
          </Button>
        </div>
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search roles"
          className="mt-4 max-w-sm"
        />
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length ? (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{toDisplayName(role.description)}</TableCell>
                  <TableCell>{permissionNames(role.permissionIds, permissions) || "None"}</TableCell>
                  <TableCell>{role.isOwnerRole ? "Owner" : "Standard"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                      disabled={!canMutateRoles || role.isOwnerRole}
                     aria-label="Edit role"><Pencil className="size-4" /></Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(role)}
                      disabled={!canMutateRoles || role.isOwnerRole}
                     aria-label="Delete role"><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No roles found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit role" : "Create role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role details and permissions."
                : "Create a new role and assign permissions."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRole} className="mt-4 space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="garage-role-name">Role name <span className="text-destructive">*</span></Label>
              <Input
                id="garage-role-name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Role name"
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="garage-role-description">Description</Label>
              <textarea
                id="garage-role-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Role purpose"
                maxLength={500}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Permissions</Label>
                <span className="text-xs text-muted-foreground">{selectedPermissionIds.length} selected</span>
              </div>
              {permissions.length ? <div className="overflow-hidden rounded-md border border-border bg-muted/20">
                <div className="border-b border-border p-3"><div className="flex flex-wrap gap-2">{selectedPermissionEntries(selectedPermissionIds, permissions).map((permission) => <button key={permission.id} type="button" onClick={() => togglePermission(permission.id)} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary transition hover:bg-primary/20" aria-label={`Remove ${permission.name}`}>{permission.name}<X className="size-3.5" /></button>)}{!selectedPermissionIds.length ? <p className="text-xs text-muted-foreground">No permissions selected yet. Choose the access this role should have.</p> : null}</div></div>
                <div className="space-y-3 p-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder="Search permissions by name or code" className="h-10 bg-background pl-9" /></div><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{filteredPermissions.length} permission{filteredPermissions.length === 1 ? "" : "s"} shown</span><div className="flex gap-1"><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedPermissionIds((current) => Array.from(new Set([...current, ...filteredPermissions.map((permission) => permission.id)])))}>Select shown</Button><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedPermissionIds([])}>Clear</Button></div></div><div className="grid max-h-64 gap-2 overflow-y-auto pr-1">{filteredPermissions.length ? filteredPermissions.map((permission) => { const selected = selectedPermissionIds.includes(permission.id); return <button key={permission.id} type="button" aria-pressed={selected} onClick={() => togglePermission(permission.id)} className={`flex items-start gap-3 rounded-md border p-3 text-left transition ${selected ? "border-primary/40 bg-primary/10" : "border-border bg-background hover:border-primary/30 hover:bg-muted/50"}`}><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{selected ? <Check className="size-3.5" /> : null}</span><span className="min-w-0"><span className="block text-sm font-medium text-foreground">{permission.name}</span><span className="block truncate text-xs text-muted-foreground">{permission.code}{permission.description ? ` - ${permission.description}` : ""}</span></span></button> }) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No permissions found.</p>}</div></div>
              </div> : <p className="text-sm text-muted-foreground">No permissions available.</p>}
            </div>

            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingRole ? "Save changes" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to delete ${deletingRole?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false)
                setDeletingRole(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteRole}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
