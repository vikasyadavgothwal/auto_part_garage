import { cookies } from "next/headers"
import { BarChart3, ClipboardList, DollarSign, Wrench } from "lucide-react"

import { ReportsDashboard } from "@/components/garage/reports/reports-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGarageBookings } from "@/lib/garage-bookings.server"
import { getGarageServices } from "@/lib/garage-services.server"
import { requestBackend } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

type PlanTier = "Free" | "Pro" | "Enterprise"
type BusinessAccessPayload = {
  ok: boolean
  access?: Array<{
    businessAccount: { type: string; plan?: { name?: string; code?: string } }
    actions?: Record<string, { allowed: boolean; reason: string | null }>
  }>
}

async function getGarageReportAccess() {
  const response = await requestBackend("/api/v1/business/access", { cookieHeader: (await cookies()).toString() }).catch(() => null)
  if (!response?.ok) {
    return { planName: null, planTier: "Free" as PlanTier, dashboard: { allowed: false, reason: "Unable to read report access." }, usage: { allowed: false, reason: "Unable to read report access." }, activity: { allowed: false, reason: "Unable to read report access." } }
  }
  const payload = (await response.json()) as BusinessAccessPayload
  const access = payload.access?.find((item) => item.businessAccount.type === "Garage")
  const code = access?.businessAccount.plan?.code
  const planTier: PlanTier = code === "Enterprise" ? "Enterprise" : code === "Pro" ? "Pro" : "Free"
  return {
    planName: access?.businessAccount.plan?.name ?? null,
    planTier,
    dashboard: access?.actions?.["reports.view"] ?? { allowed: false, reason: "Reports are not enabled." },
    usage: access?.actions?.["reports.usage"] ?? { allowed: false, reason: "Usage reports are not enabled." },
    activity: access?.actions?.["reports.activity"] ?? { allowed: false, reason: "Activity reports are not enabled." },
  }
}

const money = (amount: number) => `AED ${(amount / 100).toFixed(2)}`
const monthKey = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short" }) : "Unscheduled"
const dayKey = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }) : "Unscheduled"

export default async function GarageReportsPage() {
  const [access, bookings, services] = await Promise.all([getGarageReportAccess(), getGarageBookings(), getGarageServices()])
  const completedBookings = bookings.filter((booking) => booking.status === "completed")
  const activeServices = services.filter((service) => service.statusValue === "active")
  const revenue = completedBookings.reduce((total, booking) => total + booking.price, 0)
  const serviceBookings = services.reduce((total, service) => total + service.bookingsCount, 0)
  const avgTicket = completedBookings.length ? revenue / completedBookings.length : 0
  const completionRate = bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0

  const monthlyMap = new Map<string, { month: string; revenue: number; appointments: number }>()
  for (const booking of bookings) {
    const month = monthKey(booking.bookingDate)
    const row = monthlyMap.get(month) ?? { month, revenue: 0, appointments: 0 }
    row.appointments += 1
    if (booking.status === "completed") row.revenue += booking.price
    monthlyMap.set(month, row)
  }
  const monthlyRevenue = Array.from(monthlyMap.values()).slice(-8)

  const statusMap = new Map<string, number>()
  for (const booking of bookings) statusMap.set(booking.status, (statusMap.get(booking.status) ?? 0) + 1)
  const statusMix = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }))

  const serviceRevenue = new Map<string, number>()
  for (const booking of completedBookings) serviceRevenue.set(booking.serviceName, (serviceRevenue.get(booking.serviceName) ?? 0) + booking.price)
  const serviceDemand = services.map((service) => ({ name: service.name, bookings: service.bookingsCount, revenue: serviceRevenue.get(service.name) ?? 0 })).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)

  const dailyMap = new Map<string, { day: string; appointments: number; revenue: number }>()
  for (const booking of bookings) {
    const day = dayKey(booking.bookingDate)
    const row = dailyMap.get(day) ?? { day, appointments: 0, revenue: 0 }
    row.appointments += 1
    if (booking.status === "completed") row.revenue += booking.price
    dailyMap.set(day, row)
  }
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Unscheduled"]
  const dailyLoad = Array.from(dailyMap.values()).sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">View sales, revenue, service performance, and dashboard reports. Pro includes charts; Enterprise unlocks deeper analytics dashboards.</p>
        {access.planName ? <p className="mt-2 text-xs text-muted-foreground">Current plan: {access.planName}</p> : null}
      </div>

      {!access.dashboard.allowed ? (
        <Card className="border-amber-500/30 bg-amber-500/10"><CardContent className="pt-6 text-sm text-amber-200">{access.dashboard.reason || "Reports are not available for your current plan or staff role."}</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed appointments</CardTitle><ClipboardList className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{completedBookings.length}</div><p className="text-xs text-muted-foreground">All completed service appointments</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenue</CardTitle><DollarSign className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{money(revenue)}</div><p className="text-xs text-muted-foreground">From completed appointments</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active services</CardTitle><Wrench className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activeServices.length}</div><p className="text-xs text-muted-foreground">Services available to customers</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Service demand</CardTitle><BarChart3 className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{serviceBookings}</div><p className="text-xs text-muted-foreground">Total bookings across services</p></CardContent></Card>
          </div>
          <ReportsDashboard planTier={access.planTier} usage={access.usage} activity={access.activity} monthlyRevenue={monthlyRevenue} serviceDemand={serviceDemand} statusMix={statusMix} dailyLoad={dailyLoad} kpis={{ avgTicket: money(avgTicket), completionRate: `${completionRate}%`, activeServices: activeServices.length }} />
        </>
      )}
    </div>
  )
}
