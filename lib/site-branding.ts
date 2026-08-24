import { requestBackend } from "@/lib/auth/backend"

export type SiteBranding = { siteName: string; logoUrl: string; faviconUrl: string }

const FALLBACK_BRANDING: SiteBranding = {
  siteName: "AutoPartsPro",
  logoUrl: "",
  faviconUrl: "",
}

export async function getSiteBranding(): Promise<SiteBranding> {
  try {
    const response = await requestBackend("/api/v1/user/site-settings")
    if (!response.ok) return FALLBACK_BRANDING
    const payload = (await response.json()) as { ok?: boolean; settings?: Partial<SiteBranding> }
    return payload.ok
      ? {
          siteName: payload.settings?.siteName?.trim() || FALLBACK_BRANDING.siteName,
          logoUrl: payload.settings?.logoUrl?.trim() || "",
          faviconUrl: payload.settings?.faviconUrl?.trim() || FALLBACK_BRANDING.faviconUrl,
        }
      : FALLBACK_BRANDING
  } catch {
    return FALLBACK_BRANDING
  }
}
