"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { EllipsisVertical, Eye, Pencil, Search, Trash2, UserX } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { appRoutes } from "@/lib/routes"
import { canInviteMembers, toDisplayName, type BusinessAccessEntry, type MembersResponse, type RolesResponse } from "./types"

type StaffRoleItem = { id: string; name: string; isOwnerRole: boolean }
type StaffMemberItem = NonNullable<MembersResponse["members"]>[number]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formatDate = (value: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-AE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function statusMessage(access: BusinessAccessEntry | undefined) {
  const action = access?.actions?.["staff.invite"]
  if (action && action.allowed === false) return action.reason ?? "Staff creation is unavailable for your plan."
  if (access && !access.actions?.["staff.invite"]?.allowed) return "You do not have permission to manage staff."
  return null
}

function formatLimit(used: number | undefined, limit: number | null | undefined) {
  if (limit === null || limit === undefined) return `${used ?? 0}/unlimited`
  return `${used ?? 0}/${limit}`
}

function selectedRoleLabel(selectedRoles: Set<string>, roles: StaffRoleItem[]) {
  if (selectedRoles.size === 0) return "Select roles"
  const map = new Map(roles.map((role) => [role.id, role.name]))
  const names = Array.from(selectedRoles).map((id) => map.get(id) ?? "Role")
  const visible = names.slice(0, 3)
  const extra = Math.max(names.length - 3, 0)
  return extra ? `${visible.join(", ")} +${extra} more` : visible.join(", ")
}

function selectedRoleNames(selectedRoles: Set<string>, roles: StaffRoleItem[]) {
  const map = new Map(roles.map((role) => [role.id, role.name]))
  return Array.from(selectedRoles).map((id) => map.get(id) ?? "Role")
}

export function GarageStaffPage({ access, membersPayload, rolesPayload }: { access: BusinessAccessEntry | undefined; membersPayload: MembersResponse; rolesPayload: RolesResponse }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [editingRoles, setEditingRoles] = useState<Set<string>>(new Set())
  const [editingFirstName, setEditingFirstName] = useState("")
  const [editingLastName, setEditingLastName] = useState("")
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [memberMessage, setMemberMessage] = useState<string | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(false)
  const [memberLoading, setMemberLoading] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [viewingMember, setViewingMember] = useState<StaffMemberItem | null>(null)
  const [editingMember, setEditingMember] = useState<StaffMemberItem | null>(null)
  const [deactivatingMember, setDeactivatingMember] = useState<StaffMemberItem | null>(null)
  const [deletingMember, setDeletingMember] = useState<StaffMemberItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleQuery, setRoleQuery] = useState("")
  const [editRoleQuery, setEditRoleQuery] = useState("")
  const router = useRouter()

  const canInvite = canInviteMembers(access)
  const message = statusMessage(access)
  const isAccountOwner = Boolean(access?.businessAccount?.isOwner || access?.member?.isOwner)
  const allRoles = useMemo(() => rolesPayload.roles ?? [], [rolesPayload.roles])
  const roles = useMemo<StaffRoleItem[]>(() => allRoles.filter((role) => !role.isOwnerRole).map((role) => ({ id: role.id, name: role.name, isOwnerRole: role.isOwnerRole })), [allRoles])
  const ownerRoleIds = useMemo(() => new Set(allRoles.filter((role) => role.isOwnerRole).map((role) => role.id)), [allRoles])
  const members = useMemo(() => membersPayload.members ?? [], [membersPayload.members])
  const roleNameMap = useMemo(() => new Map(allRoles.map((role) => [role.id, role.name])), [allRoles])

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) => `${member.user.name ?? ""} ${member.user.email ?? ""} ${member.user.phone ?? ""} ${member.status}`.toLowerCase().includes(q))
  }, [members, searchQuery])
  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((role) => role.name.toLowerCase().includes(q))
  }, [roles, roleQuery])
  const filteredEditRoles = useMemo(() => {
    const q = editRoleQuery.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((role) => role.name.toLowerCase().includes(q))
  }, [roles, editRoleQuery])

  const closeInviteDialog = () => { setIsInviteOpen(false); setFirstName(""); setLastName(""); setEmail(""); setSelectedRoles(new Set()); setInviteMessage(null); setRoleQuery("") }
  const showError = (errorMessage: string) => { setInviteMessage(errorMessage); toast.error(errorMessage) }
  const showMemberError = (errorMessage: string) => { setMemberMessage(errorMessage); toast.error(errorMessage) }
  const isOwnerMember = (member: StaffMemberItem) => member.roleIds.some((roleId) => ownerRoleIds.has(roleId))

  const validateInvite = () => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()
    if (!canInvite) return message || "Staff creation is not enabled."
    if (!access?.businessAccount?.id) return "Account context is not available."
    if (!normalizedFirstName) return "Staff first name is required."
    if (!normalizedLastName) return "Staff last name is required."
    if (!normalizedEmail) return "Staff email is required."
    if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) return "Enter a valid staff email address."
    if (!roles.length) return "Create at least one role before creating staff."
    if (selectedRoles.size === 0) return "Select at least one role for this staff account."
    return null
  }

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validateInvite()
    if (validationError) return showError(validationError)
    setLoadingInvite(true); setInviteMessage(null)
    try {
      const response = await fetch("/api/business/invitations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ businessAccountId: access?.businessAccount?.id, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), roleIds: Array.from(selectedRoles) }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) showError((payload && (payload.message ?? payload.error)) || "Unable to create staff.")
      else { toast.success("Staff account created successfully."); closeInviteDialog(); router.refresh() }
    } catch (error) { showError(error instanceof Error ? error.message : "Unable to create staff.") }
    finally { setLoadingInvite(false) }
  }

  const openEdit = (member: StaffMemberItem) => { setEditingMember(member); setEditingFirstName(member.user.firstName ?? member.user.name?.split(" ")[0] ?? ""); setEditingLastName(member.user.lastName ?? member.user.name?.split(" ").slice(1).join(" ") ?? ""); setEditingRoles(new Set(member.roleIds.filter((roleId) => !ownerRoleIds.has(roleId)))); setMemberMessage(null); setEditRoleQuery("") }
  const submitEdit = async () => {
    if (!editingMember) return
    if (!access?.businessAccount?.id) return showMemberError("Account context is not available.")
    if (!editingFirstName.trim()) return showMemberError("Staff first name is required.")
    if (!editingLastName.trim()) return showMemberError("Staff last name is required.")
    if (editingRoles.size === 0) return showMemberError("Select at least one role for this staff account.")
    setMemberLoading(true); setMemberMessage(null)
    try {
      const response = await fetch(`/api/business/members/${encodeURIComponent(editingMember.id)}?businessAccountId=${encodeURIComponent(access.businessAccount.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ firstName: editingFirstName.trim(), lastName: editingLastName.trim(), roleIds: Array.from(editingRoles) }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) showMemberError((payload && (payload.message ?? payload.error)) || "Unable to update staff roles.")
      else { toast.success("Staff roles updated successfully."); setEditingMember(null); router.refresh() }
    } catch (error) { showMemberError(error instanceof Error ? error.message : "Unable to update staff roles.") }
    finally { setMemberLoading(false) }
  }
  const submitDeactivate = async () => {
    if (!deactivatingMember) return
    if (!access?.businessAccount?.id) return showMemberError("Account context is not available.")
    setMemberLoading(true); setMemberMessage(null)
    try {
      const response = await fetch(`/api/business/members/${encodeURIComponent(deactivatingMember.id)}?businessAccountId=${encodeURIComponent(access.businessAccount.id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Suspended" }) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) showMemberError((payload && (payload.message ?? payload.error)) || "Unable to unactive staff.")
      else { toast.success("Staff account unactivated successfully."); setDeactivatingMember(null); router.refresh() }
    } catch (error) { showMemberError(error instanceof Error ? error.message : "Unable to unactive staff.") }
    finally { setMemberLoading(false) }
  }
  const submitDelete = async () => {
    if (!deletingMember) return
    if (!access?.businessAccount?.id) return showMemberError("Account context is not available.")
    setMemberLoading(true); setMemberMessage(null)
    try {
      const response = await fetch(`/api/business/members/${encodeURIComponent(deletingMember.id)}?businessAccountId=${encodeURIComponent(access.businessAccount.id)}`, { method: "DELETE" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) showMemberError((payload && (payload.message ?? payload.error)) || "Unable to delete staff.")
      else { toast.success("Staff deleted successfully."); setDeletingMember(null); router.refresh() }
    } catch (error) { showMemberError(error instanceof Error ? error.message : "Unable to delete staff.") }
    finally { setMemberLoading(false) }
  }
  const toggleRoleSelection = (roleId: string) => setSelectedRoles((current) => {
    const next = new Set(current)
    if (next.has(roleId)) next.delete(roleId)
    else next.add(roleId)
    return next
  })
  const toggleEditRoleSelection = (roleId: string) => setEditingRoles((current) => {
    const next = new Set(current)
    if (next.has(roleId)) next.delete(roleId)
    else next.add(roleId)
    return next
  })

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Staff</h1><p className="mt-1 text-sm text-[#9CA3AF]">Manage garage staff accounts and role assignment.</p><p className="mt-2 text-xs text-muted-foreground">Plan usage: {formatLimit(access?.businessAccount?.usage?.staff, access?.businessAccount?.limits?.staff)} staff</p></div>
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Team members</h2><Button type="button" onClick={() => setIsInviteOpen(true)} disabled={!canInvite}>Create staff</Button></div>
        <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search staff" className="mt-4 max-w-sm" />
        <Table className="mt-4"><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email / Phone</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {filteredMembers.length ? filteredMembers.map((member) => {
            const owner = isOwnerMember(member)
            return <TableRow key={member.id}><TableCell>{toDisplayName(member.user.name)}</TableCell><TableCell>{toDisplayName(member.user.email)}{member.user.phone ? ` (${member.user.phone})` : null}</TableCell><TableCell>{member.status}</TableCell><TableCell>{formatDate(member.joinedAt ?? member.createdAt)}</TableCell><TableCell>{member.roleIds.length} role(s)</TableCell><TableCell><div className="flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label="Staff actions"><EllipsisVertical className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onClick={() => setViewingMember(member)}><Eye className="mr-2 size-4" />View</DropdownMenuItem><DropdownMenuItem disabled={owner || !isAccountOwner} onClick={() => openEdit(member)}><Pencil className="mr-2 size-4" />Edit</DropdownMenuItem><DropdownMenuItem disabled={owner || !isAccountOwner || member.status === "Suspended"} onClick={() => { setDeactivatingMember(member); setMemberMessage(null) }}><UserX className="mr-2 size-4" />Unactive</DropdownMenuItem><DropdownMenuItem disabled={owner || !isAccountOwner} onClick={() => { setDeletingMember(member); setMemberMessage(null) }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></TableCell></TableRow>
          }) : <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No staff found.</TableCell></TableRow>}
        </TableBody></Table>
      </section>
      {!canInvite ? <p className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{message || "Staff creation is disabled."}</p> : null}
      <Dialog open={isInviteOpen} onOpenChange={(open) => (open ? setIsInviteOpen(true) : closeInviteDialog())}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Create staff</DialogTitle><DialogDescription>Create a staff account and assign one or more roles.</DialogDescription></DialogHeader><form onSubmit={submitInvite} noValidate className="mt-4 space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">First name</span><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" maxLength={100} /></label><label className="grid gap-2"><span className="text-sm font-medium">Last name</span><Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" maxLength={100} /></label></div><label className="grid gap-2"><span className="text-sm font-medium">Email</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="garage-staff@example.com" /></label><RoleSelector roles={roles} filteredRoles={filteredRoles} selectedRoles={selectedRoles} roleQuery={roleQuery} setRoleQuery={setRoleQuery} toggleRoleSelection={toggleRoleSelection} />{inviteMessage ? <p className="text-sm text-destructive">{inviteMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={closeInviteDialog} disabled={loadingInvite}>Cancel</Button><Button type="submit" disabled={loadingInvite}>{loadingInvite ? "Creating..." : "Create account"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(viewingMember)} onOpenChange={(open) => !open && setViewingMember(null)}><DialogContent><DialogHeader><DialogTitle>Staff details</DialogTitle><DialogDescription>View account and assigned role details.</DialogDescription></DialogHeader>{viewingMember ? <div className="space-y-3 text-sm"><p><span className="text-muted-foreground">Name:</span> {toDisplayName(viewingMember.user.name)}</p><p><span className="text-muted-foreground">Email:</span> {toDisplayName(viewingMember.user.email)}</p><p><span className="text-muted-foreground">Phone:</span> {toDisplayName(viewingMember.user.phone)}</p><p><span className="text-muted-foreground">Status:</span> {viewingMember.status}</p><p><span className="text-muted-foreground">Joined:</span> {formatDate(viewingMember.joinedAt ?? viewingMember.createdAt)}</p><div><p className="text-muted-foreground">Roles:</p><div className="mt-2 flex flex-wrap gap-2">{viewingMember.roleIds.map((roleId) => <span key={roleId} className="rounded-sm border border-border bg-muted px-2 py-1 text-xs">{roleNameMap.get(roleId) ?? "Role"}</span>)}</div></div></div> : null}</DialogContent></Dialog>
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit staff</DialogTitle><DialogDescription>Update the staff name and assigned roles.</DialogDescription></DialogHeader><div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">{toDisplayName(editingMember?.user.email)}</p><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2"><span className="text-sm font-medium">First name</span><Input value={editingFirstName} onChange={(event) => setEditingFirstName(event.target.value)} maxLength={100} /></label><label className="grid gap-2"><span className="text-sm font-medium">Last name</span><Input value={editingLastName} onChange={(event) => setEditingLastName(event.target.value)} maxLength={100} /></label></div><RoleSelector roles={roles} filteredRoles={filteredEditRoles} selectedRoles={editingRoles} roleQuery={editRoleQuery} setRoleQuery={setEditRoleQuery} toggleRoleSelection={toggleEditRoleSelection} />{memberMessage ? <p className="text-sm text-destructive">{memberMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setEditingMember(null)} disabled={memberLoading}>Cancel</Button><Button type="button" onClick={submitEdit} disabled={memberLoading}>{memberLoading ? "Saving..." : "Save changes"}</Button></DialogFooter></div></DialogContent></Dialog>
      <Dialog open={Boolean(deactivatingMember)} onOpenChange={(open) => !open && setDeactivatingMember(null)}><DialogContent><DialogHeader><DialogTitle>Unactive staff</DialogTitle><DialogDescription>This blocks the staff member from using this dashboard account.</DialogDescription></DialogHeader><p className="text-sm">Unactive {toDisplayName(deactivatingMember?.user.email)}?</p>{memberMessage ? <p className="text-sm text-destructive">{memberMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setDeactivatingMember(null)} disabled={memberLoading}>Cancel</Button><Button type="button" onClick={submitDeactivate} disabled={memberLoading}>{memberLoading ? "Saving..." : "Unactive"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deletingMember)} onOpenChange={(open) => !open && setDeletingMember(null)}><DialogContent><DialogHeader><DialogTitle>Delete staff account</DialogTitle><DialogDescription>This deletes the staff account from this dashboard, the database, and Firebase Auth.</DialogDescription></DialogHeader><p className="text-sm">Delete {toDisplayName(deletingMember?.user.email)} permanently?</p>{memberMessage ? <p className="text-sm text-destructive">{memberMessage}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setDeletingMember(null)} disabled={memberLoading}>Cancel</Button><Button type="button" variant="destructive" onClick={submitDelete} disabled={memberLoading}>{memberLoading ? "Deleting..." : "Delete account"}</Button></DialogFooter></DialogContent></Dialog>
      <p className="text-xs text-muted-foreground">Need more seats/roles? Open the <a href={appRoutes.plans} className="text-primary">Plans</a> page.</p>
    </div>
  )
}

function RoleSelector({ roles, filteredRoles, selectedRoles, roleQuery, setRoleQuery, toggleRoleSelection }: { roles: StaffRoleItem[]; filteredRoles: StaffRoleItem[]; selectedRoles: Set<string>; roleQuery: string; setRoleQuery: (value: string) => void; toggleRoleSelection: (roleId: string) => void }) {
  return <div><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Assign roles</p><span className="rounded-sm border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">{selectedRoles.size} selected</span></div><div className="mt-2 space-y-3 rounded-md border border-border bg-muted/30 p-3"><DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button type="button" variant="outline" className="min-h-12 w-full justify-between whitespace-normal px-3 text-left">{selectedRoleLabel(selectedRoles, roles)}</Button></DropdownMenuTrigger><DropdownMenuContent className="w-[min(420px,calc(100vw-3rem))] p-0" align="start"><div className="border-b border-border p-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={roleQuery} onChange={(event) => setRoleQuery(event.target.value)} onKeyDown={(event) => event.stopPropagation()} placeholder="Search roles" className="h-10 pl-9" /></div></div><div className="max-h-56 overflow-y-auto p-2">{filteredRoles.length ? filteredRoles.map((role) => <DropdownMenuCheckboxItem key={role.id} checked={selectedRoles.has(role.id)} onCheckedChange={() => toggleRoleSelection(role.id)} onSelect={(event) => event.preventDefault()} className="min-h-11 rounded-sm">{role.name}</DropdownMenuCheckboxItem>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No roles found.</p>}</div></DropdownMenuContent></DropdownMenu>{selectedRoles.size ? <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto">{selectedRoleNames(selectedRoles, roles).map((roleName) => <span key={roleName} className="rounded-sm border border-border bg-background px-2 py-1 text-xs">{roleName}</span>)}</div> : null}</div></div>
}
