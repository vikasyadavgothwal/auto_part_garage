import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const backend = await requestBackend("/api/v1/garage/settings/images", {
    method: "POST",
    cookieHeader: request.headers.get("cookie"),
    body: await request.formData(),
    userAgent: request.headers.get("user-agent"),
  })
  const contentType = backend.headers.get("content-type") ?? ""
  const body = await backend.text()
  const responseBody =
    contentType.includes("application/json")
      ? body
      : JSON.stringify({
          ok: false,
          message:
            backend.status === 413
              ? "Upload is too large. Upload up to 5 gallery images, 10 MB each."
              : "Garage image server returned an invalid response.",
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
