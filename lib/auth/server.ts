import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload, DashboardUser } from "@/lib/auth/types"
import { appRoutes } from "@/lib/routes"

export async function requireGarageUser(): Promise<DashboardUser> {
  const response = await requestBackend("/api/v1/user/auth/me", {
    cookieHeader: (await cookies()).toString(),
  })

  if (response.status === 401) redirect("/api/auth/refresh")
  if (!response.ok) redirect(appRoutes.login)

  const payload = (await response.json()) as AuthApiPayload
  if (!payload.ok || !payload.user.roles.includes("Garage")) {
    redirect(`${appRoutes.login}?error=role`)
  }

  return payload.user
}
