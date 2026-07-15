import { appPath } from "@/lib/routes"

let refreshRequest: Promise<boolean> | null = null

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const options = { ...init, credentials: "include" as const }
  let response = await fetch(input, options)
  if (response.status === 401) {
    refreshRequest ??= fetch(appPath("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).then((result) => result.ok).finally(() => { refreshRequest = null })
    if (await refreshRequest) response = await fetch(input, options)
  }
  return response
}

export async function logoutGarage() {
  const { signOutFirebase } = await import("@/lib/auth/firebase-client")
  await Promise.allSettled([
    fetch(appPath("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }),
    signOutFirebase(),
  ])
}
