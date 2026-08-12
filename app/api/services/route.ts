import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function proxyServices(request: NextRequest, method: "GET" | "POST") {
  const backend = await requestBackend("/api/v1/garage/services", {
    method,
    cookieHeader: request.headers.get("cookie"),
    body: method === "POST" ? await request.text() : null,
    contentType: method === "POST" ? "application/json" : null,
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
  return proxyServices(request, "GET")
}

export async function POST(request: NextRequest) {
  return proxyServices(request, "POST")
}
