import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim()
  if (!key) {
    return NextResponse.json(
      { ok: false, message: "Garage image is not available" },
      { status: 400 },
    )
  }

  const backend = await requestBackend(
    `/api/v1/garage/settings/images/view?key=${encodeURIComponent(key)}`,
    {
      cookieHeader: request.headers.get("cookie"),
      userAgent: request.headers.get("user-agent"),
    },
  )
  const response = new NextResponse(backend.body, {
    status: backend.status,
    headers: {
      "content-type": backend.headers.get("content-type") ?? "application/json",
      "cache-control": backend.ok ? "private, max-age=240" : "no-store",
    },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}
