import { NextRequest, NextResponse } from "next/server"

const accessCookie = "garage_access_token"
const refreshCookie = "garage_refresh_token"
const dashboardBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)

function normalizeBasePath(value?: string) {
  const trimmedValue = (value || "").trim().replace(/\/+$/, "")
  if (!trimmedValue || trimmedValue === "/") return ""
  return trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`
}

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
  if (request.method !== "GET") return NextResponse.next()
  const pathname = request.nextUrl.pathname
  if (pathname.includes("/api/") || pathname.endsWith("/login") || pathname.includes("/_next/")) return NextResponse.next()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-garage-return-to", `${pathname}${request.nextUrl.search}`)
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } })
  if (!request.headers.get("accept")?.includes("text/html")) return nextResponse()
  const refresh = request.cookies.get(refreshCookie)?.value
  const access = request.cookies.get(accessCookie)?.value
  if (!refresh || (access && !expiresSoon(access))) return nextResponse()
  const destination = request.nextUrl.clone()
  destination.pathname = `${dashboardBasePath}/api/auth/refresh`
  destination.search = ""
  destination.searchParams.set("returnTo", `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(destination)
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
