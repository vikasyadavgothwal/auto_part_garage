import { NextRequest, NextResponse } from "next/server"

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"
import type { AuthApiPayload } from "@/lib/auth/types"

export const dynamic = "force-dynamic"

async function readBackendJson(response: Response): Promise<AuthApiPayload | null> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) return null
  try { return (await response.json()) as AuthApiPayload } catch { return null }
}

export async function POST(request: NextRequest) {
  const backend = await requestBackend("/api/v1/user/auth/login/verify", {
    method: "POST",
    body: await request.text(),
    contentType: "application/json",
    userAgent: request.headers.get("user-agent"),
  })
  const payload = await readBackendJson(backend)
  if (!payload) return NextResponse.json({ ok: false, success: false, message: "Backend login verification endpoint did not return JSON." }, { status: 502 })
  const response = NextResponse.json(payload, { status: backend.status })
  if (backend.ok) applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}
