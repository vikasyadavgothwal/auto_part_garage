import { redirect } from "next/navigation"

import { DashboardActions } from "@/components/garage/dashboard/dashboard-actions"
import { DashboardStats } from "@/components/garage/dashboard/dashboard-stats"
import { MonthlyPerformanceCard } from "@/components/garage/dashboard/monthly-performance-card"
import { RecentReviewsCard } from "@/components/garage/dashboard/recent-reviews-card"
import { TodaysScheduleSection } from "@/components/garage/dashboard/todays-schedule-section"
import { UpcomingBookingsSection } from "@/components/garage/dashboard/upcoming-bookings-section"
import { AccessRestrictedCard } from "@/components/garage/shared/access-restricted-card"
import { PageHeading } from "@/components/garage/shared/page-heading"
import { getGarageBusinessAccess } from "@/lib/business-access.server"
import { getGarageDashboardData } from "@/lib/garage-dashboard.server"
import { appPath, appRoutes } from "@/lib/routes"

export const dynamic = "force-dynamic"

type GarageDashboardPageProps = {
  searchParams?: Promise<{ payment?: string; session_id?: string }>
}

export default async function GarageDashboardPage({ searchParams }: GarageDashboardPageProps) {
  const params = await searchParams
  if (params?.payment) {
    const query = new URLSearchParams({ payment: params.payment })
    if (params.session_id) query.set("session_id", params.session_id)
    redirect(`${appPath(appRoutes.plans)}?${query.toString()}`)
  }

  const access = await getGarageBusinessAccess()
  const canBookings = access.canView("bookings")
  const canSchedule = access.canView("schedule")
  const canServices = access.canView("services")
  const canReviews = access.canView("reviews")
  const canReports = access.canView("reports")
  const canSeeOperations = access.isOwner || canBookings || canSchedule || canServices || canReviews || canReports
  const dashboardPageData = canSeeOperations ? await getGarageDashboardData() : null

  return (
    <div className="space-y-8">
      <PageHeading
        title={dashboardPageData?.title ?? "Garage Dashboard"}
        description={dashboardPageData?.description ?? "Dashboard access requires an assigned section."}
      />

      {!dashboardPageData ? <AccessRestrictedCard title="No dashboard access" message="Ask the account owner to assign at least one Garage section to your role." /> : null}
      {dashboardPageData ? <DashboardStats stats={dashboardPageData.stats} /> : null}
      {dashboardPageData && (canSchedule || canServices) ? <DashboardActions canViewSchedule={canSchedule} canViewServices={canServices} /> : null}
      {dashboardPageData && canSchedule ? <TodaysScheduleSection schedule={dashboardPageData.todaysSchedule} /> : null}
      {dashboardPageData && canBookings ? <UpcomingBookingsSection bookings={dashboardPageData.upcomingBookings} /> : null}
      {dashboardPageData && canReports ? <MonthlyPerformanceCard performance={dashboardPageData.performance} /> : null}
      {dashboardPageData && canReviews ? <RecentReviewsCard reviews={dashboardPageData.reviews} /> : null}
    </div>
  )
}
