import { cookies } from "next/headers"

import { OfflineAppointmentDialog } from "@/components/garage/schedule/offline-appointment-dialog"
import { ScheduleCalendarTable } from "@/components/garage/schedule/schedule-calendar-table"
import { ScheduleLegendCard } from "@/components/garage/schedule/schedule-legend-card"
import { ScheduleOverviewCard } from "@/components/garage/schedule/schedule-overview-card"
import { ScheduleSettingsCard } from "@/components/garage/schedule/schedule-settings-card"
import { UpcomingTodayCard } from "@/components/garage/schedule/upcoming-today-card"
import {
  buildSchedulePageData,
  getGarageBookings,
} from "@/lib/garage-bookings.server"
import { getGarageServices } from "@/lib/garage-services.server"
import { requestBackend } from "@/lib/auth/backend"
import { appRoutes } from "@/lib/routes"

export const dynamic = "force-dynamic"

type GarageSchedulePageProps = {
  searchParams: Promise<{ week?: string | string[] }>
}

const weekHref = (weekOffset: number) =>
  weekOffset === 0
    ? appRoutes.schedule
    : `${appRoutes.schedule}?week=${weekOffset}`

type BusinessAccessPayload = {
  ok: boolean
  access?: Array<{
    businessAccount: { type: string }
    actions?: Record<string, { allowed: boolean; reason: string | null }>
  }>
}

async function getGarageAction(action: string) {
  const response = await requestBackend("/api/v1/business/access", {
    cookieHeader: (await cookies()).toString(),
  }).catch(() => null)
  if (!response?.ok) return { allowed: false, reason: "Unable to read plan access." }
  const payload = (await response.json()) as BusinessAccessPayload
  return payload.access?.find((item) => item.businessAccount.type === "Garage")?.actions?.[action] ?? {
    allowed: false,
    reason: "This action is not enabled.",
  }
}

export default async function GarageSchedulePage({
  searchParams,
}: GarageSchedulePageProps) {
  const rawWeek = (await searchParams).week
  const parsedWeek = Number.parseInt(
    Array.isArray(rawWeek) ? (rawWeek[0] ?? "0") : (rawWeek ?? "0"),
    10,
  )
  const weekOffset = Number.isFinite(parsedWeek)
    ? Math.max(-52, Math.min(52, parsedWeek))
    : 0
  const [bookings, services, appointmentAction] = await Promise.all([
    getGarageBookings(),
    getGarageServices(),
    getGarageAction("appointments.create"),
  ])
  const schedulePageData = buildSchedulePageData(bookings, weekOffset)

  return (
    <div className="min-w-0 space-y-8">
      <OfflineAppointmentDialog
        title={schedulePageData.title}
        description={schedulePageData.description}
        actionLabel={schedulePageData.primaryActionLabel}
        services={services}
        bookings={bookings}
        canCreateAppointment={appointmentAction.allowed}
        disabledReason={appointmentAction.reason}
      />

      <ScheduleOverviewCard
        weekLabel={schedulePageData.weekLabel}
        weekStats={schedulePageData.weekStats}
        previousWeekHref={weekHref(weekOffset - 1)}
        nextWeekHref={weekHref(weekOffset + 1)}
      />
      <ScheduleCalendarTable
        days={schedulePageData.days}
        timeSlots={schedulePageData.timeSlots}
        appointments={schedulePageData.appointments}
      />
      <ScheduleLegendCard />

      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
        <ScheduleSettingsCard />
        <UpcomingTodayCard appointments={schedulePageData.upcomingToday} />
      </div>
    </div>
  )
}
