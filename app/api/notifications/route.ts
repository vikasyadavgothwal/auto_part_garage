import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!request.headers.get("cookie")) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  }
  const backend = await requestBackend("/api/v1/notifications", {
    cookieHeader: request.headers.get("cookie"),
    userAgent: request.headers.get("user-agent"),
  })
  const response = new NextResponse(await backend.text(), {
    status: backend.status,
    headers: {
      "content-type": backend.headers.get("content-type") ?? "application/json",
    },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}
