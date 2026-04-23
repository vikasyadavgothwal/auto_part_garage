import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionHeader } from "@/components/garage/shared/section-header"
import {
  tableCellClass,
  tableCellMutedClass,
  tableHeadClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import type { DashboardPageData } from "@/lib/garage-page-data"
import { appRoutes } from "@/lib/routes"

type UpcomingBookingsSectionProps = {
  bookings: DashboardPageData["upcomingBookings"]
}

export function UpcomingBookingsSection({
  bookings,
}: UpcomingBookingsSectionProps) {
  return (
    <section>
      <SectionHeader
        title="Upcoming Bookings"
        actionLabel="View All"
        href={appRoutes.bookings}
        className="mb-4"
      />

      <Card className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={tableHeaderRowClass}>
                <TableHead className={tableHeadClass}>Date</TableHead>
                <TableHead className={tableHeadClass}>Time</TableHead>
                <TableHead className={tableHeadClass}>Booking ID</TableHead>
                <TableHead className={tableHeadClass}>Customer</TableHead>
                <TableHead className={tableHeadClass}>Vehicle</TableHead>
                <TableHead className={tableHeadClass}>Service</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bookings.map((item) => (
                <TableRow key={item.bookingId} className={tableRowClass}>
                  <TableCell className={tableCellMutedClass}>
                    {item.date}
                  </TableCell>
                  <TableCell className={tableCellMutedClass}>
                    {item.time}
                  </TableCell>
                  <TableCell className={tableCellClass}>
                    <span className="font-medium text-primary">
                      {item.bookingId}
                    </span>
                  </TableCell>
                  <TableCell className={tableCellMutedClass}>
                    {item.customer}
                  </TableCell>
                  <TableCell className={tableCellMutedClass}>
                    {item.vehicle}
                  </TableCell>
                  <TableCell className={tableCellMutedClass}>
                    {item.service}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  )
}
