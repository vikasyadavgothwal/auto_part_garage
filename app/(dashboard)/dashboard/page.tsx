"use client"
import Link from "next/link"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dashboardPageData } from "@/lib/garage-page-data"
import { appRoutes } from "@/lib/routes"

const dashboardStatIcons = {
  calendar: Calendar,
  clock: Clock,
  star: Star,
  checkCircle2: CheckCircle2,
}

function StatusBadge({
  label,
  variant,
}: {
  label: string
  variant: "warning" | "info"
}) {
  if (variant === "warning") {
    return (
      <Badge className="border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10">
        {label}
      </Badge>
    )
  }

  return (
    <Badge className="border-brand-info/20 bg-brand-info/10 text-brand-info hover:bg-brand-info/10">
      {label}
    </Badge>
  )
}
function ReviewStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <Star
          key={index}
          className="h-4 w-4 fill-primary text-primary"
        />
      ))}
    </div>
  )
}
export default function GarageDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {dashboardPageData.title}
        </h1>
        <p className="text-brand-muted">{dashboardPageData.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardPageData.stats.map((item) => {
          const Icon = dashboardStatIcons[item.iconKey]

          return (
            <Card
              key={item.title}
              className="surface-card transition-all hover:border-primary"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="text-sm font-medium text-brand-muted">
                    {item.title}
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="mb-2 text-3xl font-bold text-foreground">
                  {item.value}
                </div>

                <div className="text-sm text-brand-muted">{item.subtext}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href={appRoutes.schedule}
          className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/10 p-6 transition-all hover:bg-primary/20"
        >
          <div className="rounded-lg bg-primary p-3">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>

          <div>
            <div className="text-lg font-bold text-foreground">
              View Schedule
            </div>
            <div className="text-sm text-brand-muted">
              Manage your calendar
            </div>
          </div>
        </Link>

        <button
          type="button"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary"
        >
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <Wrench className="h-6 w-6 text-primary" />
          </div>

          <div>
            <div className="text-lg font-bold text-foreground">
              Block Time Slot
            </div>
            <div className="text-sm text-brand-muted">
              Mark unavailable hours
            </div>
          </div>
        </button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Today&apos;s Schedule
          </h2>

          <Link
            href={appRoutes.schedule}
            className="text-sm font-medium text-primary transition-colors hover:text-brand-primary-hover"
          >
            View Full Calendar
          </Link>
        </div>

        <Card className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-background hover:bg-background">
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Time
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Booking ID
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Customer
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Vehicle
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Service
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Duration
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboardPageData.todaysSchedule.map((item) => (
                  <TableRow
                    key={item.bookingId}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-brand-panel-strong"
                  >
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.time}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <span className="font-medium text-primary">
                        {item.bookingId}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.customer}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.vehicle}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.service}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.duration}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
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

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Upcoming Bookings
          </h2>

          <Link
            href={appRoutes.bookings}
            className="text-sm font-medium text-primary transition-colors hover:text-brand-primary-hover"
          >
            View All
          </Link>
        </div>

        <Card className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-background hover:bg-background">
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Date
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Time
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Booking ID
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Customer
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Vehicle
                  </TableHead>
                  <TableHead className="px-6 py-4 text-sm font-semibold text-brand-muted">
                    Service
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboardPageData.upcomingBookings.map((item) => (
                  <TableRow
                    key={item.bookingId}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-brand-panel-strong"
                  >
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.date}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.time}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <span className="font-medium text-primary">
                        {item.bookingId}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.customer}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.vehicle}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-brand-muted">
                      {item.service}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            This Month&apos;s Performance
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {dashboardPageData.performance.map((item) => (
              <div key={item.title}>
                <div className="mb-2 text-sm text-brand-muted">{item.title}</div>
                <div className="mb-1 text-2xl font-bold text-foreground">
                  {item.value}
                </div>
                <div
                  className={`text-sm ${
                    item.highlight ? "text-primary" : "text-brand-muted"
                  }`}
                >
                  {item.subtext}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Recent Reviews
            </h2>

            <Link
              href={appRoutes.reviews}
              className="text-sm font-medium text-primary transition-colors hover:text-brand-primary-hover"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {dashboardPageData.reviews.map((review) => (
              <div
                key={`${review.name}-${review.date}`}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">
                    {review.name}
                  </div>
                  <ReviewStars count={review.rating} />
                </div>

                <p className="mb-2 text-sm text-brand-muted">
                  {review.comment}
                </p>

                <div className="text-xs text-brand-muted">{review.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
