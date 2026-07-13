import { NextResponse } from "next/server"

const BACKEND_ACCESS_COOKIE = process.env.USER_ACCESS_COOKIE_NAME ?? "user_access_token"
const BACKEND_REFRESH_COOKIE = process.env.USER_REFRESH_COOKIE_NAME ?? "user_refresh_token"
export const GARAGE_ACCESS_COOKIE = "garage_access_token"
export const GARAGE_REFRESH_COOKIE = "garage_refresh_token"

const backendUrl = (path: string) =>
  new URL(
    path,
    process.env.ADMIN_API_BASE_URL?.trim() ||
      process.env.BACKEND_URL?.trim() ||
      process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.trim() ||
      "http://localhost:3000",
  )

const parseCookieHeader = (header: string | null) => {
  const cookies = new Map<string, string>()
  for (const segment of header?.split(";") ?? []) {
    const index = segment.indexOf("=")
    if (index > 0) {
      cookies.set(segment.slice(0, index).trim(), segment.slice(index + 1).trim())
    }
  }
  return cookies
}

export const toBackendCookieHeader = (header: string | null) => {
  const cookies = parseCookieHeader(header)
  const accessToken = cookies.get(GARAGE_ACCESS_COOKIE)
  const refreshToken = cookies.get(GARAGE_REFRESH_COOKIE)
  cookies.delete(BACKEND_ACCESS_COOKIE)
  cookies.delete(BACKEND_REFRESH_COOKIE)
  cookies.delete(GARAGE_ACCESS_COOKIE)
  cookies.delete(GARAGE_REFRESH_COOKIE)
  if (accessToken) cookies.set(BACKEND_ACCESS_COOKIE, accessToken)
  if (refreshToken) cookies.set(BACKEND_REFRESH_COOKIE, refreshToken)
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ")
}

const dashboardCookieName = (name: string) => {
  if (name === BACKEND_ACCESS_COOKIE) return GARAGE_ACCESS_COOKIE
  if (name === BACKEND_REFRESH_COOKIE) return GARAGE_REFRESH_COOKIE
  return name
}

const toDashboardSetCookie = (value: string) => {
  const separator = value.indexOf("=")
  if (separator <= 0) return value
  return `${dashboardCookieName(value.slice(0, separator))}${value.slice(separator)}`
}

export const getSetCookieHeaders = (headers: Headers) => {
  const enhanced = headers as Headers & { getSetCookie?: () => string[] }
  return enhanced.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie")!] : [])
}

export const applySetCookieHeaders = (
  response: NextResponse | Response,
  values: string[],
) => values.forEach((value) => response.headers.append("set-cookie", toDashboardSetCookie(value)))

export const mergeCookieHeader = (current: string | null, values: string[]) => {
  const cookies = parseCookieHeader(current)
  for (const value of values) {
    const pair = value.split(";", 1)[0]
    const index = pair.indexOf("=")
    if (index > 0) {
      cookies.set(
        dashboardCookieName(pair.slice(0, index).trim()),
        pair.slice(index + 1).trim(),
      )
    }
  }
  return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ")
}

export async function requestBackend(
  path: string,
  options: {
    method?: string
    cookieHeader?: string | null
    body?: BodyInit | null
    contentType?: string | null
    userAgent?: string | null
    forwardedFor?: string | null
  } = {},
) {
  const headers = new Headers({ accept: "application/json" })
  if (options.cookieHeader) {
    headers.set("cookie", toBackendCookieHeader(options.cookieHeader))
  }
  if (options.contentType) headers.set("content-type", options.contentType)
  if (options.userAgent) headers.set("user-agent", options.userAgent)
  if (options.forwardedFor) headers.set("x-forwarded-for", options.forwardedFor)
  return fetch(backendUrl(path), {
    method: options.method ?? "GET",
    cache: "no-store",
    headers,
    body: options.body,
  })
}
