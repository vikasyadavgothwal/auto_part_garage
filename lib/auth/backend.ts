import { NextResponse } from "next/server"
import {
  DEFAULT_PROXY_TIMEOUT_MS,
  fetchWithTimeout,
  getBackendBaseUrl as getBackendBaseUrlFromEnv,
  getSetCookieHeaders as getSetCookieHeadersShared,
  mergeCookieHeader as mergeCookieHeaderShared,
  streamBackendRequest,
  toBackendCookieHeader as toBackendCookieHeaderShared,
  toDashboardSetCookie as toDashboardSetCookieShared,
} from "@shared/backend-proxy"

const BACKEND_ACCESS_COOKIE = process.env.USER_ACCESS_COOKIE_NAME ?? "user_access_token"
const BACKEND_REFRESH_COOKIE = process.env.USER_REFRESH_COOKIE_NAME ?? "user_refresh_token"
export const GARAGE_ACCESS_COOKIE = "garage_access_token"
export const GARAGE_REFRESH_COOKIE = "garage_refresh_token"

const COOKIE_MAP = {
  backendAccessCookie: BACKEND_ACCESS_COOKIE,
  backendRefreshCookie: BACKEND_REFRESH_COOKIE,
  dashboardAccessCookie: GARAGE_ACCESS_COOKIE,
  dashboardRefreshCookie: GARAGE_REFRESH_COOKIE,
}

const getBackendBaseUrlFromLocal = () =>
  getBackendBaseUrlFromEnv({
    envNames: [
      "ADMIN_API_BASE_URL",
      "BACKEND_URL",
      "NEXT_PUBLIC_ADMIN_API_BASE_URL",
    ],
    fallback: process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000",
    missingMessage:
      "Missing backend API URL. Set ADMIN_API_BASE_URL, BACKEND_URL, or NEXT_PUBLIC_ADMIN_API_BASE_URL.",
  })

const backendUrl = (path: string) => new URL(path, getBackendBaseUrlFromLocal())

export const getSetCookieHeaders = (headers: Headers) =>
  getSetCookieHeadersShared(headers)

export const applySetCookieHeaders = (
  response: NextResponse | Response,
  values: string[],
) => values.forEach((value) => response.headers.append("set-cookie", toDashboardSetCookieShared(value, COOKIE_MAP)))

export const mergeCookieHeader = (current: string | null, values: string[]) =>
  mergeCookieHeaderShared(current, values, COOKIE_MAP)

export async function requestBackend(
  path: string,
  options: {
    method?: string
    cookieHeader?: string | null
    body?: BodyInit | null
    contentType?: string | null
    headers?: HeadersInit
    userAgent?: string | null
    forwardedFor?: string | null
    timeoutMs?: number
  } = {},
) {
  const headers = new Headers({ accept: "application/json" })
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => headers.set(key, value))
  }
  if (options.cookieHeader) {
    headers.set("cookie", toBackendCookieHeaderShared(options.cookieHeader, COOKIE_MAP))
  }
  if (options.contentType) headers.set("content-type", options.contentType)
  if (options.userAgent) headers.set("user-agent", options.userAgent)
  if (options.forwardedFor) headers.set("x-forwarded-for", options.forwardedFor)
  try {
    return await fetchWithTimeout(backendUrl(path), {
      method: options.method ?? "GET",
      cache: "no-store",
      headers,
      body: options.body,
      timeoutMs: options.timeoutMs ?? DEFAULT_PROXY_TIMEOUT_MS,
    })
  } catch {
    return Response.json({ ok: false, message: "Backend unavailable" }, { status: 503 })
  }
}

export async function forwardBackendRequest(request: Request, path: string) {
  const sourceUrl = new URL(request.url)
  const url = backendUrl(path)
  url.search = sourceUrl.search
  return streamBackendRequest({
    request,
    backendUrl: url,
    method: request.method.toUpperCase(),
    setCookieMap: COOKIE_MAP,
  })
}
