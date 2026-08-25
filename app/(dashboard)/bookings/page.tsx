import { BookingStats } from "@/components/garage/bookings/booking-stats"
import { BookingsTable } from "@/components/garage/bookings/bookings-table"
import { CalendarViewCard } from "@/components/garage/bookings/calendar-view-card"
import { AccessRestrictedCard } from "@/components/garage/shared/access-restricted-card"
import { PageHeading } from "@/components/garage/shared/page-heading"
import { getGarageBusinessAccess } from "@/lib/business-access.server"
import {
  buildBookingsPageData,
  getGarageBookings,
  getGarageBookingsPage,
} from "@/lib/garage-bookings.server"
import { pageFromSearchParams, type PageSearchParams } from "@/lib/pagination"

export const dynamic = "force-dynamic"

export default async function GarageBookingsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const access = await getGarageBusinessAccess()
  if (!access.canView("bookings")) return <AccessRestrictedCard message="You do not have permission to view Garage bookings." />

  const page = pageFromSearchParams(await searchParams)
  const [allBookings, tablePage] = await Promise.all([
    getGarageBookings(),
    getGarageBookingsPage(page),
  ])
  const bookingsPageData = buildBookingsPageData(allBookings)
  const tableData = buildBookingsPageData(tablePage.bookings)

  return (
    <div className="space-y-8">
      <PageHeading
        title={bookingsPageData.title}
        description={bookingsPageData.description}
      />

      <BookingStats stats={bookingsPageData.stats} />
      <BookingsTable
        bookings={tableData.bookings}
        pagination={tablePage.pagination}
      />
      <CalendarViewCard calendarView={bookingsPageData.calendarView} />
    </div>
  )
}
