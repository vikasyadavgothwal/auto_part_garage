import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

type NotificationReadContext = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  context: NotificationReadContext,
) {
  const { id } = await context.params
  const backend = await requestBackend(
    `/api/v1/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      cookieHeader: request.headers.get("cookie"),
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
