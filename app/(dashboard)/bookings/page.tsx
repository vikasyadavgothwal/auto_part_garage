import { BookingStats } from "@/components/garage/bookings/booking-stats"
import { BookingsTable } from "@/components/garage/bookings/bookings-table"
import { CalendarViewCard } from "@/components/garage/bookings/calendar-view-card"
import { PageHeading } from "@/components/garage/shared/page-heading"
import {
  buildBookingsPageData,
  getGarageBookings,
} from "@/lib/garage-bookings.server"

export const dynamic = "force-dynamic"

export default async function GarageBookingsPage() {
  const bookingsPageData = buildBookingsPageData(await getGarageBookings())

  return (
    <div className="space-y-8">
      <PageHeading
        title={bookingsPageData.title}
        description={bookingsPageData.description}
      />

      <BookingStats stats={bookingsPageData.stats} />
      <BookingsTable bookings={bookingsPageData.bookings} />
      <CalendarViewCard calendarView={bookingsPageData.calendarView} />
    </div>
  )
}
