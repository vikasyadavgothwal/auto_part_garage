import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, mergeCookieHeader, requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload } from "@/lib/auth/types"

export const dynamic = "force-dynamic"

async function readBackendJson(response: Response): Promise<AuthApiPayload | null> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return null
  }

  try {
    return (await response.json()) as AuthApiPayload
  } catch {
    return null
  }
}

function normalizeForwardedFor(value: string): string {
  if (process.env.NODE_ENV !== "production") {
    const [clientIp, ...remainingIps] = value.split(",")
    const normalizedClientIp = clientIp.trim()
    if (
      normalizedClientIp === "::1" ||
      normalizedClientIp === "[::1]" ||
      normalizedClientIp === "localhost"
    ) {
      return ["127.0.0.1", ...remainingIps].join(",")
    }
  }

  return value
}

function getForwardedFor(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return normalizeForwardedFor(forwardedFor)
  }

  const realIp =
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip")
  if (realIp) {
    return normalizeForwardedFor(realIp)
  }

  if (process.env.NODE_ENV !== "production") {
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"])
    if (localHosts.has(request.nextUrl.hostname)) {
      return "127.0.0.1"
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  const forwardedFor = getForwardedFor(request)
  const backend = await requestBackend("/api/v1/user/auth/login", {
    method: "POST",
    body: await request.text(),
    contentType: "application/json",
    userAgent: request.headers.get("user-agent"),
    forwardedFor,
  })
  const payload = await readBackendJson(backend)
  const issuedCookies = getSetCookieHeaders(backend.headers)

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message:
          "Backend login endpoint did not return JSON. Check ADMIN_API_BASE_URL points to auto_parts_admin.",
      },
      { status: 502 },
    )
  }

  if (backend.ok && payload.ok && !payload.user.roles.includes("Garage")) {
    await requestBackend("/api/v1/user/auth/logout", {
      method: "POST",
      cookieHeader: mergeCookieHeader(null, issuedCookies),
      userAgent: request.headers.get("user-agent"),
      forwardedFor,
    })
    return NextResponse.json(
      { ok: false, success: false, message: "This account does not have garage access." },
      { status: 403 },
    )
  }

  const response = NextResponse.json(payload, { status: backend.status })
  const retryAfter = backend.headers.get("retry-after")
  if (retryAfter) {
    response.headers.set("retry-after", retryAfter)
  }
  if (backend.ok) applySetCookieHeaders(response, issuedCookies)
  return response
}
