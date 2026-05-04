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
import { StatusBadge } from "@/components/garage/shared/status-badge"
import {
  tableCellClass,
  tableCellMutedClass,
  tableHeadClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import type { DashboardPageData } from "@/lib/garage-page-data"
import { appRoutes } from "@/lib/routes"

type TodaysScheduleSectionProps = {
  schedule: DashboardPageData["todaysSchedule"]
}

export function TodaysScheduleSection({
  schedule,
}: TodaysScheduleSectionProps) {
  return (
    <section>
      <SectionHeader
        title="Today's Schedule"
        actionLabel="View Full Calendar"
        href={appRoutes.schedule}
        className="mb-4"
      />

      <Card className="surface-card overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={tableHeaderRowClass}>
                <TableHead className={tableHeadClass}>Time</TableHead>
                <TableHead className={tableHeadClass}>Booking ID</TableHead>
                <TableHead className={tableHeadClass}>Customer</TableHead>
                <TableHead className={tableHeadClass}>Vehicle</TableHead>
                <TableHead className={tableHeadClass}>Service</TableHead>
                <TableHead className={tableHeadClass}>Duration</TableHead>
                <TableHead className={tableHeadClass}>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {schedule.map((item) => (
                <TableRow key={item.bookingId} className={tableRowClass}>
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
                  <TableCell className={tableCellMutedClass}>
                    {item.duration}
                  </TableCell>
                  <TableCell className={tableCellClass}>
                    <StatusBadge
                      label={item.status}
                      variant={item.statusVariant}
                    />
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
