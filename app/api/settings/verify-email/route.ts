import { NextRequest, NextResponse } from "next/server"

import { requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const backend = await requestBackend(
    `/api/v1/garage/settings/verify-email?token=${encodeURIComponent(token)}`,
  )
  return new NextResponse(await backend.text(), {
    status: backend.status,
    headers: {
      "content-type": backend.headers.get("content-type") ?? "application/json",
    },
  })
}
