import { NextRequest, NextResponse } from "next/server"
import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const sourceUrl = new URL(request.url)
  const backend = await requestBackend(`/api/v1/business/audit-logs/export${sourceUrl.search}`, {
    cookieHeader: request.headers.get("cookie"),
    userAgent: request.headers.get("user-agent"),
  })
  const response = new NextResponse(await backend.text(), {
    status: backend.status,
    headers: {
      "content-type": backend.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "content-disposition": backend.headers.get("content-disposition") ?? "attachment; filename=business-audit-logs.csv",
    },
  })
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers))
  return response
}
