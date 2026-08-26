import type { ReactNode } from "react"
import { cookies } from "next/headers"
import Link from "next/link"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/app-header"
import { SessionKeepalive } from "@/components/auth/session-keepalive"
import { requireGarageUser } from "@/lib/auth/server"
import { requestBackend } from "@/lib/auth/backend"
import { getSiteBranding } from "@/lib/site-branding"
import { getGarageSettings } from "@/lib/garage-settings.server"
import type { GarageProfileRecord } from "@/lib/garage-settings"
import { appPath, appRoutes } from "@/lib/routes"

type BusinessAccessPayload = {
  ok: boolean
  access?: Array<{
    businessAccount: { type: string; isOwner?: boolean; plan: { name: string; code: string }; usage?: { appointments?: number }; limits?: { appointments?: number | null } }
    activeAddOns?: Array<{ featureKey: string }>
    visibleMenus: string[]
    enabledFeatures?: string[]
  }>
}

const isApiFeature = (feature: string) => feature === "api.standard" || feature === "api.enterprise"

const isFreePlan = (plan?: { code: string; name: string }) =>
  plan?.code === "Free" || /\bfree\b/i.test(plan?.name ?? "")

const isGarageProfileComplete = (profile: GarageProfileRecord) =>
  Boolean(
    profile.garageName?.trim() &&
      profile.contactEmail?.trim() &&
      profile.mobile?.trim() &&
      profile.responseTime?.trim() &&
      profile.address?.trim() &&
      profile.country?.trim() &&
      profile.state?.trim() &&
      profile.city?.trim() &&
      profile.about?.trim() &&
      profile.workingDays.length,
  )

async function getBusinessAccess() {
  const response = await requestBackend("/api/v1/business/access", {
    cookieHeader: (await cookies()).toString(),
  }).catch(() => null)
  if (!response?.ok) {
    return {
      visibleMenus: [],
      planName: null,
      planCode: null,
      isOwner: false,
      appointmentUsage: 0,
      appointmentLimit: null,
    }
  }
  const payload = (await response.json()) as BusinessAccessPayload
  const access = payload.access?.find((item) => item.businessAccount.type === "Garage")
  const freePlan = isFreePlan(access?.businessAccount.plan)
  const hasApiAddOn = access?.activeAddOns?.some((item) => isApiFeature(item.featureKey)) ?? false
  const hasPlanApiAccess =
    !freePlan &&
    (access?.enabledFeatures?.some(isApiFeature) ?? false)
  return {
    visibleMenus: (access?.visibleMenus ?? []).filter((menu) => menu !== "api-keys" || hasPlanApiAccess || hasApiAddOn),
    planName: access?.businessAccount.plan.name ?? null,
    planCode: access?.businessAccount.plan.code ?? null,
    isOwner: access?.businessAccount.isOwner ?? false,
    appointmentUsage: access?.businessAccount.usage?.appointments ?? 0,
    appointmentLimit: access?.businessAccount.limits?.appointments ?? null,
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [user, businessAccess, branding, cookieStore, profile] = await Promise.all([
    requireGarageUser(),
    getBusinessAccess(),
    getSiteBranding(),
    cookies(),
    getGarageSettings(),
  ])
  const language = cookieStore.get("app_lang")?.value === "ar" ? "ar" : "en"
  const showProfileBanner = businessAccess.isOwner && !isGarageProfileComplete(profile)
  const appointmentLimitReached = businessAccess.appointmentLimit !== null && businessAccess.appointmentUsage >= businessAccess.appointmentLimit

  return (
    <SidebarProvider dir="ltr">
      <SessionKeepalive />
      <AppSidebar branding={branding} visibleMenus={businessAccess.visibleMenus} planName={businessAccess.planName} planCode={businessAccess.planCode} isOwner={businessAccess.isOwner} />
      <SidebarInset
        data-dashboard-content="true"
        dir={language === "ar" ? "rtl" : "ltr"}
        className="min-h-svh min-w-0 bg-brand-surface"
      >
        <DashboardHeader user={user} />
        <div className="flex min-w-0 flex-1 flex-col p-4 lg:p-6">
          {showProfileBanner ? (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>Complete your garage profile so customers can book your services correctly.</span>
                <Link href={appPath(appRoutes.settings)} className="font-medium text-amber-50 underline underline-offset-4">
                  Complete profile
                </Link>
              </div>
            </div>
          ) : null}
          {appointmentLimitReached ? (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <p className="font-semibold text-amber-50">Appointment capacity reached</p>
              <p className="mt-1 text-amber-100/90">
                Your current plan allows {businessAccess.appointmentLimit} appointments this month. Increase your appointment capacity to keep accepting customer bookings. <Link href={appPath(appRoutes.addOns)} className="text-primary underline underline-offset-4">Add capacity</Link>
              </p>
            </div>
          ) : null}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
