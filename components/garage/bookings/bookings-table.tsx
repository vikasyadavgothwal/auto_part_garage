import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  tableCellMutedClass,
  tableHeadLeftClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import type { BookingsPageData } from "@/lib/garage-page-data"

type BookingsTableProps = {
  bookings: BookingsPageData["bookings"]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  return (
    <Card className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className={tableHeadLeftClass}>Booking ID</TableHead>
              <TableHead className={tableHeadLeftClass}>Date</TableHead>
              <TableHead className={tableHeadLeftClass}>Time</TableHead>
              <TableHead className={tableHeadLeftClass}>Customer</TableHead>
              <TableHead className={tableHeadLeftClass}>Vehicle</TableHead>
              <TableHead className={tableHeadLeftClass}>Service</TableHead>
              <TableHead className={tableHeadLeftClass}>Revenue</TableHead>
              <TableHead className={tableHeadLeftClass}>Status</TableHead>
              <TableHead className={tableHeadLeftClass}>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} className={tableRowClass}>
                <TableCell className={tableCellMutedClass}>
                  <span className="font-medium text-primary">
                    {booking.id}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {booking.date}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {booking.time}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {booking.customer}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {booking.vehicle}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {booking.service}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <span className="font-semibold text-foreground">
                    {booking.revenue}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${booking.statusClass}`}
                  >
                    {booking.status}
                  </Badge>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <Button
                    type="button"
                    className="rounded-lg bg-brand-panel-strong px-4 py-1.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
