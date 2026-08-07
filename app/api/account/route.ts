import { NextRequest, NextResponse } from "next/server"

import {
  applySetCookieHeaders,
  getSetCookieHeaders,
  requestBackend,
} from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function proxyAccount(request: NextRequest, method: "GET" | "PATCH") {
  const backend = await requestBackend("/api/v1/user/account", {
    method,
    cookieHeader: request.headers.get("cookie"),
    body: method === "PATCH" ? await request.text() : undefined,
    contentType: method === "PATCH" ? "application/json" : undefined,
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

export async function GET(request: NextRequest) {
  return proxyAccount(request, "GET")
}

export async function PATCH(request: NextRequest) {
  return proxyAccount(request, "PATCH")
}
