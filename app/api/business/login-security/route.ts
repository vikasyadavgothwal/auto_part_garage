import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function proxy(request: NextRequest, method: "GET" | "POST") {
  const backend = await requestBackend("/api/v1/business/login-security", {
    method,
    cookieHeader: request.headers.get("cookie"),
    body: method === "POST" ? await request.text() : undefined,
    contentType: method === "POST" ? "application/json" : undefined,
    userAgent: request.headers.get("user-agent"),
  })
  const response = new NextResponse(await backend.text(), { status: backend.status, headers: { "content-type": backend.headers.get("content-type") ?? "application/json" } })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}

export async function GET(request: NextRequest) { return proxy(request, "GET") }
export async function POST(request: NextRequest) { return proxy(request, "POST") }
