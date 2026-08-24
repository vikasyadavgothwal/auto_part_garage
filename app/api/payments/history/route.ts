import { NextRequest, NextResponse } from "next/server";

import { applySetCookieHeaders, getSetCookieHeaders, requestBackend } from "@/lib/auth/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams(request.nextUrl.searchParams);
  params.set("scope", "business");
  const backendPath = `/api/v1/payments/history?${params.toString()}`;
  const backend = await requestBackend(backendPath, {
    cookieHeader: request.headers.get("cookie"),
    userAgent: request.headers.get("user-agent"),
  });
  const response = new NextResponse(await backend.text(), {
    status: backend.status,
    headers: { "content-type": backend.headers.get("content-type") ?? "application/json" },
  });
  applySetCookieHeaders(response, getSetCookieHeaders(backend.headers));
  return response;
}
