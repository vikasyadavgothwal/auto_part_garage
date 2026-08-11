const DEFAULT_BACKEND_TIMEOUT_MS = 10_000

export type CookieNameMap = {
  backendAccessCookie: string
  backendRefreshCookie: string
  dashboardAccessCookie: string
  dashboardRefreshCookie: string
}

export type BackendEnvOptions = {
  envNames: readonly string[]
  fallback?: string
  missingMessage: string
}

export const DEFAULT_PROXY_TIMEOUT_MS = DEFAULT_BACKEND_TIMEOUT_MS

export type TimeoutRequestInit = RequestInit & {
  duplex?: "half"
  timeoutMs?: number
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: TimeoutRequestInit = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_PROXY_TIMEOUT_MS, signal, ...requestInit } = init
  if (signal) {
    return fetch(input, { ...requestInit, signal })
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(new Error("Backend request timed out")),
    timeoutMs,
  )

  try {
    return await fetch(input, { ...requestInit, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

const parseCookieHeader = (header: string | null) => {
  const cookies = new Map<string, string>()

  for (const segment of header?.split(";") ?? []) {
    const trimmed = segment.trim()
    const index = trimmed.indexOf("=")
    if (index > 0) {
      cookies.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim())
    }
  }

  return cookies
}

const encodeCookies = (cookies: Map<string, string>) =>
  Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; ")

export function getBackendBaseUrl({
  envNames,
  fallback,
  missingMessage,
}: BackendEnvOptions): string {
  for (const name of envNames) {
    const value = process.env[name]?.trim()
    if (value) {
      return value
    }
  }

  if (fallback !== undefined && process.env.NODE_ENV !== "production") {
    return fallback
  }

  throw new Error(missingMessage)
}

export function getSetCookieHeaders(headers: Headers): string[] {
  const enhancedHeaders = headers as Headers & {
    getSetCookie?: () => string[]
  }

  const values = enhancedHeaders.getSetCookie?.()
  if (values?.length) {
    return values
  }

  const combinedValue = headers.get("set-cookie")
  return combinedValue ? [combinedValue] : []
}

export function toBackendCookieHeader(
  header: string | null,
  cookieMap?: CookieNameMap,
): string {
  if (!header || !cookieMap) {
    return header ?? ""
  }

  const cookies = parseCookieHeader(header)
  const accessToken = cookies.get(cookieMap.dashboardAccessCookie)
  const refreshToken = cookies.get(cookieMap.dashboardRefreshCookie)

  cookies.delete(cookieMap.backendAccessCookie)
  cookies.delete(cookieMap.backendRefreshCookie)
  cookies.delete(cookieMap.dashboardAccessCookie)
  cookies.delete(cookieMap.dashboardRefreshCookie)

  if (accessToken) {
    cookies.set(cookieMap.backendAccessCookie, accessToken)
  }

  if (refreshToken) {
    cookies.set(cookieMap.backendRefreshCookie, refreshToken)
  }

  return encodeCookies(cookies)
}

const mapCookieName = (
  name: string,
  cookieMap: CookieNameMap,
  source: "backend" | "dashboard",
) => {
  if (source === "backend") {
    if (name === cookieMap.backendAccessCookie) return cookieMap.dashboardAccessCookie
    if (name === cookieMap.backendRefreshCookie) return cookieMap.dashboardRefreshCookie
  }

  if (source === "dashboard") {
    if (name === cookieMap.dashboardAccessCookie) return cookieMap.backendAccessCookie
    if (name === cookieMap.dashboardRefreshCookie) return cookieMap.backendRefreshCookie
  }

  return name
}

export function toDashboardSetCookie(
  value: string,
  cookieMap?: CookieNameMap,
): string {
  if (!cookieMap) {
    return value
  }

  const semicolonIndex = value.indexOf(";")
  const pair = semicolonIndex === -1 ? value : value.slice(0, semicolonIndex)
  const index = pair.indexOf("=")
  if (index <= 0) {
    return value
  }

  const name = pair.slice(0, index).trim()
  const mappedName = mapCookieName(name, cookieMap, "backend")

  if (mappedName === name) {
    return value
  }

  const attributes = semicolonIndex === -1 ? "" : value.slice(semicolonIndex)
  return `${mappedName}${pair.slice(index)}${attributes}`
}

export function mergeCookieHeader(
  currentHeader: string | null,
  setCookieValues: string[],
  cookieMap?: CookieNameMap,
): string {
  const cookies = parseCookieHeader(currentHeader)

  for (const setCookie of setCookieValues) {
    const translatedCookie = cookieMap
      ? toDashboardSetCookie(setCookie, cookieMap)
      : setCookie

    const pair = translatedCookie.split(";", 1)[0]
    const index = pair.indexOf("=")
    if (index <= 0) {
      continue
    }

    cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim())
  }

  return encodeCookies(cookies)
}

export type StreamBackendRequestOptions = {
  request: Request
  backendUrl: URL
  method?: string
  includeBody?: boolean
  contentType?: string | null
  cookieHeader?: string | null
  userAgent?: string | null
  forwardedFor?: string | null
  responseContentTypeFallback?: string
  responseHeaders?: HeadersInit
  includeSetCookie?: boolean
  setCookieMap?: CookieNameMap
  timeoutMs?: number
  copyBackendHeaders?: string[]
}

export async function streamBackendRequest({
  request,
  backendUrl,
  method: requestedMethod,
  includeBody = true,
  contentType,
  cookieHeader,
  userAgent,
  forwardedFor,
  responseContentTypeFallback = "application/json",
  responseHeaders,
  includeSetCookie = false,
  setCookieMap,
  timeoutMs = DEFAULT_PROXY_TIMEOUT_MS,
  copyBackendHeaders,
}: StreamBackendRequestOptions): Promise<Response> {
  const method = (requestedMethod ?? request.method).toUpperCase()
  const headers = new Headers({ accept: "application/json" })
  const requestContentType = contentType ?? request.headers.get("content-type")
  const requestCookieHeader = cookieHeader ?? request.headers.get("cookie")
  const requestUserAgent = userAgent ?? request.headers.get("user-agent")
  const requestForwardedFor = forwardedFor ?? request.headers.get("x-forwarded-for")

  if (requestContentType) {
    headers.set("content-type", requestContentType)
  }

  const translatedCookieHeader = setCookieMap
    ? toBackendCookieHeader(requestCookieHeader, setCookieMap)
    : requestCookieHeader

  if (translatedCookieHeader) {
    headers.set("cookie", translatedCookieHeader)
  }

  if (requestUserAgent) {
    headers.set("user-agent", requestUserAgent)
  }

  if (requestForwardedFor) {
    headers.set("x-forwarded-for", requestForwardedFor)
  }

  const hasBody = includeBody && method !== "GET" && method !== "HEAD"

  const backendRequestInit: RequestInit & { duplex?: "half" } = {
    method,
    cache: "no-store",
    headers,
    body: hasBody ? request.body : undefined,
  }

  if (hasBody) {
    backendRequestInit.duplex = "half"
  }

  let backendResponse: Response
  try {
    backendResponse = await fetchWithTimeout(backendUrl, {
      ...backendRequestInit,
      timeoutMs,
    })
  } catch {
    return Response.json(
      { ok: false, message: "Backend unavailable" },
      { status: 503 },
    )
  }

  const proxyHeaders = new Headers(responseHeaders)
  if (!proxyHeaders.has("content-type")) {
    proxyHeaders.set(
      "content-type",
      backendResponse.headers.get("content-type") ?? responseContentTypeFallback,
    )
  }

  if (copyBackendHeaders?.length) {
    for (const headerName of copyBackendHeaders) {
      const headerValue = backendResponse.headers.get(headerName)
      if (headerValue) {
        proxyHeaders.set(headerName, headerValue)
      }
    }
  }

  const response = new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: proxyHeaders,
  })

  if (includeSetCookie) {
    for (const value of getSetCookieHeaders(backendResponse.headers)) {
      response.headers.append(
        "set-cookie",
        setCookieMap ? toDashboardSetCookie(value, setCookieMap) : value,
      )
    }
  }

  return response
}
