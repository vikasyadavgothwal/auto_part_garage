import { NextRequest, NextResponse } from "next/server"

import {
  applySetCookieHeaders,
  getSetCookieHeaders,
  requestBackend,
} from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

async function proxy(roleId: string, request: NextRequest, method: string) {
  const businessAccountId = request.nextUrl.searchParams.get("businessAccountId")
  const query = businessAccountId
    ? `?businessAccountId=${encodeURIComponent(businessAccountId)}`
    : ""
  const backend = await requestBackend(`/api/v1/business/roles/${encodeURIComponent(roleId)}${query}`, {
    
    method,
    cookieHeader: request.headers.get("cookie"),
    body: method === "DELETE" ? undefined : await request.text(),
    contentType: method === "DELETE" ? undefined : "application/json",
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxy(id, request, "PATCH")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxy(id, request, "DELETE")
}
