import { requestBackend } from "@/lib/auth/backend"

export type SiteBranding = { siteName: string; logoUrl: string; faviconUrl: string; faviconKey: string }

const FALLBACK_BRANDING: SiteBranding = {
  siteName: "AutoPartsPro",
  logoUrl: "",
  faviconUrl: "",
  faviconKey: "",
}

const CLOUDFRONT_URL = "https://d138jhvnngk7dx.cloudfront.net"
const S3_BUCKET_HOST = "auto-parts-pro.s3.eu-north-1.amazonaws.com"
const cloudFrontAsset = (key: string) => `${CLOUDFRONT_URL}/${key.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`
const displayAssetUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.host === S3_BUCKET_HOST ? cloudFrontAsset(decodeURIComponent(parsed.pathname).replace(/^\/+/, "")) : url
  } catch {
    return url
  }
}

const faviconPath = (settings: Partial<SiteBranding>) =>
  settings.faviconKey?.trim()
    ? cloudFrontAsset(settings.faviconKey.trim())
    : displayAssetUrl(settings.faviconUrl?.trim() || FALLBACK_BRANDING.faviconUrl)

export async function getSiteBranding(): Promise<SiteBranding> {
  try {
    const response = await requestBackend("/api/v1/user/site-settings")
    if (!response.ok) return FALLBACK_BRANDING
    const payload = (await response.json()) as { ok?: boolean; settings?: Partial<SiteBranding> }
    return payload.ok
      ? {
          siteName: payload.settings?.siteName?.trim() || FALLBACK_BRANDING.siteName,
          logoUrl: displayAssetUrl(payload.settings?.logoUrl?.trim() || ""),
          faviconUrl: faviconPath(payload.settings ?? {}),
          faviconKey: payload.settings?.faviconKey?.trim() || "",
        }
      : FALLBACK_BRANDING
  } catch {
    return FALLBACK_BRANDING
  }
}
