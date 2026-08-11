import { cookies } from "next/headers"

import { GarageApiKeysPage } from "@/components/garage/integrations/api-keys-page"
import { requestBackend } from "@/lib/auth/backend"

type AccessPayload = {
  ok: boolean
  access?: Array<{ businessAccount: { id: string; name: string; type: string; plan: { name: string } } }>
}

export default async function ApiKeysPage() {
  const response = await requestBackend("/api/v1/business/access", {
    cookieHeader: (await cookies()).toString(),
  }).catch(() => null)
  const payload = response?.ok ? ((await response.json()) as AccessPayload) : null
  const access = payload?.access?.find((item) => item.businessAccount.type === "Garage")
  return <GarageApiKeysPage access={access} />
}
