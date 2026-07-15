import { NextRequest } from "next/server"

import { requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const backend = await requestBackend("/api/v1/notifications/stream", {
    cookieHeader: request.headers.get("cookie"),
    userAgent: request.headers.get("user-agent"),
  })

  return new Response(backend.body, {
    status: backend.status,
    headers: {
      "content-type":
        backend.headers.get("content-type") ?? "text/event-stream",
      "cache-control": "no-cache, no-transform",
    },
  })
}
