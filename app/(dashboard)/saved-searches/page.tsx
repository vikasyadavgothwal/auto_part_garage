import { cookies } from "next/headers"

import { GarageSavedSearchesPage } from "@/components/garage/saved-searches/saved-searches-page"
import { requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

type AccessPayload = { ok: boolean; access?: Array<{ businessAccount?: { id: string; type?: string; plan?: { accountType?: string } }; actions?: Record<string, { allowed: boolean; reason?: string | null }> }> }
type SavedSearchesPayload = { ok: boolean; savedSearches?: Array<{ id: string; name: string; scope: string; query: Record<string, unknown>; createdAt: string }> }

export default async function GarageSavedSearchesRoute() {
  const cookieHeader = (await cookies()).toString()
  const accessResponse = await requestBackend("/api/v1/business/access", { cookieHeader }).catch(() => null)
  const accessPayload = accessResponse?.ok ? ((await accessResponse.json()) as AccessPayload) : { ok: false }
  const access = accessPayload.access?.find((item) =>
    item.businessAccount?.type === "Garage" || item.businessAccount?.plan?.accountType === "Garage"
  )
  const accountId = access?.businessAccount?.id
  const savedResponse = accountId
    ? await requestBackend(`/api/v1/business/saved-searches?businessAccountId=${encodeURIComponent(accountId)}`, { cookieHeader }).catch(() => null)
    : null
  const savedPayload = savedResponse?.ok ? ((await savedResponse.json()) as SavedSearchesPayload) : { ok: false }

  return <GarageSavedSearchesPage access={access} initialSavedSearches={savedPayload.savedSearches ?? []} />
}
