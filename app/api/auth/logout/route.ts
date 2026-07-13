import { NextRequest, NextResponse } from "next/server"

import {
  applySetCookieHeaders,
  GARAGE_ACCESS_COOKIE,
  GARAGE_REFRESH_COOKIE,
  getSetCookieHeaders,
  requestBackend,
} from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  let values: string[] = []
  try {
    const backend = await requestBackend("/api/v1/user/auth/logout", {
      method: "POST",
      cookieHeader: request.headers.get("cookie"),
      userAgent: request.headers.get("user-agent"),
    })
    values = getSetCookieHeaders(backend.headers)
  } catch {}

  const response = NextResponse.json({ ok: true, success: true, message: "Logged out successfully" })
  applySetCookieHeaders(response, values)
  const options = { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 }
  response.cookies.set(GARAGE_ACCESS_COOKIE, "", options)
  response.cookies.set(GARAGE_REFRESH_COOKIE, "", options)
  return response
}
