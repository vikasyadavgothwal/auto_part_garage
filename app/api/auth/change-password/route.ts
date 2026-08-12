import { NextRequest, NextResponse } from "next/server"

import {
  applySetCookieHeaders,
  getSetCookieHeaders,
  requestBackend,
} from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const backend = await requestBackend("/api/v1/user/auth/change-password", {
    method: "POST",
    cookieHeader: request.headers.get("cookie"),
    body: await request.text(),
    contentType: "application/json",
    headers: {
      ...(process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ? { "x-firebase-web-api-key": process.env.NEXT_PUBLIC_FIREBASE_API_KEY }
        : {}),
      "x-firebase-auth-origin": request.nextUrl.origin,
    },
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
