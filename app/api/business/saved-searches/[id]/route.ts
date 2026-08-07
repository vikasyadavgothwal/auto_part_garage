import { NextRequest, NextResponse } from "next/server"

import {
  applySetCookieHeaders,
  getSetCookieHeaders,
  requestBackend,
} from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const sourceUrl = new URL(request.url)
  const backend = await requestBackend(
    `/api/v1/business/saved-searches/${encodeURIComponent(id)}${sourceUrl.search}`,
    {
      method: "DELETE",
      cookieHeader: request.headers.get("cookie"),
      userAgent: request.headers.get("user-agent"),
    },
  )
  const response = new NextResponse(await backend.text(), {
    status: backend.status,
    headers: { "content-type": backend.headers.get("content-type") ?? "application/json" },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}
