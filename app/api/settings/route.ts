import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function proxySettings(request: NextRequest, method: "GET" | "PATCH") {
  const backend = await requestBackend("/api/v1/garage/settings", {
    method,
    cookieHeader: request.headers.get("cookie"),
    body: method === "PATCH" ? await request.text() : null,
    contentType: method === "PATCH" ? "application/json" : null,
    userAgent: request.headers.get("user-agent"),
  })
  const contentType = backend.headers.get("content-type") ?? ""
  const body = await backend.text()
  const responseBody =
    contentType.includes("application/json")
      ? body
      : JSON.stringify({
          ok: false,
          message: "Garage settings server returned an invalid response.",
        })
  const response = new NextResponse(responseBody, {
    status: backend.status,
    headers: {
      "content-type": contentType.includes("application/json")
        ? contentType
        : "application/json",
    },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}

export async function GET(request: NextRequest) {
  return proxySettings(request, "GET")
}

export async function PATCH(request: NextRequest) {
  return proxySettings(request, "PATCH")
}
