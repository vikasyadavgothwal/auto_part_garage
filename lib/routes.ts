const DEFAULT_BASE_PATH = "/fleet"

function normalizeBasePath(value?: string) {
  if (!value) {
    return DEFAULT_BASE_PATH
  }

  const trimmedValue = value.trim().replace(/\/+$/, "")

  if (!trimmedValue || trimmedValue === "/") {
    return DEFAULT_BASE_PATH
  }

  return trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`
}

export const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)

export const appRoutes = {
  overview: "/dashboard",
  schedule: "/schedule",
  bookings: "/bookings",
  services: "/services",
  reviews: "/reviews",
  settings: "/settings",
} as const

export function stripBasePath(pathname: string | null) {
  if (!pathname) {
    return appRoutes.overview
  }

  if (pathname === appBasePath) {
    return appRoutes.overview
  }

  if (pathname.startsWith(`${appBasePath}/`)) {
    return pathname.slice(appBasePath.length) || appRoutes.overview
  }

  return pathname
}
