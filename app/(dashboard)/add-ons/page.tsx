import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { GarageFeatureAccessPage, type BusinessAccess } from "@/components/garage/subscription/feature-access-page"
import { requestBackend } from "@/lib/auth/backend"
import { appRoutes } from "@/lib/routes"

type AccessPayload = { ok: boolean; access?: BusinessAccess[] }

export default async function AddOnsPage() {
  const response = await requestBackend("/api/v1/business/access", { cookieHeader: (await cookies()).toString() }).catch(() => null)
  const payload = response?.ok ? ((await response.json()) as AccessPayload) : null
  const access = payload?.access?.find((item) => item.businessAccount.type === "Garage")
  if (access?.businessAccount.plan.code === "Enterprise") redirect(appRoutes.plans)
  return <GarageFeatureAccessPage access={access} area="add-ons" />
}
