import { DashboardActions } from "@/components/garage/dashboard/dashboard-actions"
import { DashboardStats } from "@/components/garage/dashboard/dashboard-stats"
import { MonthlyPerformanceCard } from "@/components/garage/dashboard/monthly-performance-card"
import { RecentReviewsCard } from "@/components/garage/dashboard/recent-reviews-card"
import { TodaysScheduleSection } from "@/components/garage/dashboard/todays-schedule-section"
import { UpcomingBookingsSection } from "@/components/garage/dashboard/upcoming-bookings-section"
import { PageHeading } from "@/components/garage/shared/page-heading"
import { getGarageDashboardData } from "@/lib/garage-dashboard.server"

export const dynamic = "force-dynamic"

export default async function GarageDashboardPage() {
  const dashboardPageData = await getGarageDashboardData()

  return (
    <div className="space-y-8">
      <PageHeading
        title={dashboardPageData.title}
        description={dashboardPageData.description}
      />

      <DashboardStats stats={dashboardPageData.stats} />
      <DashboardActions />
      <TodaysScheduleSection schedule={dashboardPageData.todaysSchedule} />
      <UpcomingBookingsSection bookings={dashboardPageData.upcomingBookings} />
      <MonthlyPerformanceCard performance={dashboardPageData.performance} />
      <RecentReviewsCard reviews={dashboardPageData.reviews} />
    </div>
  )
}
