import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, mergeCookieHeader, requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload } from "@/lib/auth/types"
import { appPath, appRoutes } from "@/lib/routes"

export const dynamic = "force-dynamic"

async function refresh(request: NextRequest) {
  const current = request.headers.get("cookie")
  const backend = await requestBackend("/api/v1/user/auth/refresh", {
    method: "POST",
    cookieHeader: current,
    userAgent: request.headers.get("user-agent"),
  })
  const values = getSetCookieHeaders(backend.headers)
  if (!backend.ok) {
    const response = NextResponse.json({ ok: false, success: false, message: "Session expired" }, { status: 401 })
    applySetCookieHeaders(response, values)
    return { response, ok: false }
  }

  const me = await requestBackend("/api/v1/user/auth/me", {
    cookieHeader: mergeCookieHeader(current, values),
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
  const response = NextResponse.redirect(new URL(appPath(result.ok ? appRoutes.overview : appRoutes.login), request.url))
  getSetCookieHeaders(result.response.headers).forEach((value) => response.headers.append("set-cookie", value))
  return response
}
