import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload, DashboardUser } from "@/lib/auth/types"
import { appRoutes } from "@/lib/routes"

const safeReturnTo = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") && !value.includes("/api/auth/")
    ? value
    : appRoutes.overview

export async function requireGarageUser(): Promise<DashboardUser> {
  const response = await requestBackend("/api/v1/user/auth/me", {
    cookieHeader: (await cookies()).toString(),
  })

  if (response.status === 401) {
    const returnTo = safeReturnTo((await headers()).get("x-garage-return-to"))
    redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`)
  }
  if (!response.ok) redirect(appRoutes.login)

  const payload = (await response.json()) as AuthApiPayload
  if (!payload.ok || !payload.user.roles.includes("Garage")) {
    redirect(`${appRoutes.login}?error=role`)
  }

  return payload.user
}
