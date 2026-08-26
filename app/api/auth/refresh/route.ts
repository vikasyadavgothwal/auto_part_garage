import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, mergeCookieHeader, requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload } from "@/lib/auth/types"
import { appPath, appRoutes } from "@/lib/routes"

export const dynamic = "force-dynamic"

const AUTH_REFRESH_TIMEOUT_MS = 10_000

async function refresh(request: NextRequest) {
  const current = request.headers.get("cookie")
  if (!current) {
    return { response: NextResponse.json({ ok: false, success: false, message: "Session expired" }, { status: 401 }), ok: false }
  }
  const backend = await requestBackend("/api/v1/user/auth/refresh", {
    method: "POST",
    cookieHeader: current,
    userAgent: request.headers.get("user-agent"),
    timeoutMs: AUTH_REFRESH_TIMEOUT_MS,
  })
  const values = getSetCookieHeaders(backend.headers)
  if (!backend.ok) {
    const response = NextResponse.json({ ok: false, success: false, message: "Session expired" }, { status: 401 })
    applySetCookieHeaders(response, values)
    return { response, ok: false }
  }

  const me = await requestBackend("/api/v1/user/auth/me", {
    cookieHeader: mergeCookieHeader(current, values),
    timeoutMs: AUTH_REFRESH_TIMEOUT_MS,
  })
  const payload = (await me.json()) as AuthApiPayload
  if (!me.ok || !payload.ok || !payload.user.roles.includes("Garage")) {
    const response = NextResponse.json({ ok: false, success: false, message: "Garage access is required" }, { status: 403 })
    applySetCookieHeaders(response, values)
    return { response, ok: false }
  }

  const response = NextResponse.json(payload)
  applySetCookieHeaders(response, values)
  return { response, ok: true }
}

export async function POST(request: NextRequest) { return (await refresh(request)).response }

export async function GET(request: NextRequest) {
  const result = await refresh(request)
  const requestedReturn = request.nextUrl.searchParams.get("returnTo")
  const safeReturn = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") && !requestedReturn.includes("/api/auth/")
    ? requestedReturn
    : appPath(appRoutes.overview)
  const loginPath = result.response.status === 403
    ? `${appPath(appRoutes.login)}?error=owner_disabled`
    : appPath(appRoutes.login)
  const response = NextResponse.redirect(new URL(result.ok ? safeReturn : loginPath, request.url))
  getSetCookieHeaders(result.response.headers).forEach((value: string) => response.headers.append("set-cookie", value))
  return response
}
