import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

type RouteContext = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

async function proxyService(
  request: NextRequest,
  context: RouteContext,
  method: "PATCH" | "DELETE",
) {
  const { id } = await context.params
  const backend = await requestBackend(
    `/api/v1/garage/services/${encodeURIComponent(id)}`,
    {
      method,
      cookieHeader: request.headers.get("cookie"),
      body: method === "PATCH" ? await request.text() : null,
      contentType: method === "PATCH" ? "application/json" : null,
      userAgent: request.headers.get("user-agent"),
    },
  )
  const response = new NextResponse(await backend.text(), {
    status: backend.status,
    headers: {
      "content-type": backend.headers.get("content-type") ?? "application/json",
    },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyService(request, context, "PATCH")
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyService(request, context, "DELETE")
}
