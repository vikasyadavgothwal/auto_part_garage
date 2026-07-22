import { NextRequest, NextResponse } from "next/server"

const accessCookie = "garage_access_token"
const refreshCookie = "garage_refresh_token"

const expiresSoon = (token: string) => {
  try {
    const payload = token.split(".")[1]
    if (!payload) return true
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4))) as { exp?: number }
    return !decoded.exp || decoded.exp * 1000 <= Date.now() + 30_000
  } catch { return true }
}

export function proxy(request: NextRequest) {
  if (request.method !== "GET" || !request.headers.get("accept")?.includes("text/html")) return NextResponse.next()
  const pathname = request.nextUrl.pathname
  if (pathname.includes("/api/") || pathname.endsWith("/login") || pathname.includes("/_next/")) return NextResponse.next()
  const refresh = request.cookies.get(refreshCookie)?.value
  const access = request.cookies.get(accessCookie)?.value
  if (!refresh || (access && !expiresSoon(access))) return NextResponse.next()
  const destination = request.nextUrl.clone()
  destination.pathname = "/garage_dashboard/api/auth/refresh"
  destination.search = ""
  destination.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(destination)
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
