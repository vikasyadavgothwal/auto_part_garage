"use client"

import { Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { bookingsPageData } from "@/lib/garage-page-data"

const bookingStatIcons = {
  calendar: Calendar,
}

export default function GarageBookingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {bookingsPageData.title}
        </h1>
        <p className="text-brand-muted">{bookingsPageData.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {bookingsPageData.stats.map((item) => {
          const Icon = item.iconKey ? bookingStatIcons[item.iconKey] : undefined

          return (
            <Card key={item.title} className="surface-card">
              <CardContent className="p-6">
                {item.showIcon && Icon ? (
                  <div className="mb-2 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="text-sm text-brand-muted">{item.title}</div>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-brand-muted">
                    {item.title}
                  </div>
                )}

                <div className={`text-3xl font-bold ${item.valueClass}`}>
                  {item.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-background hover:bg-background">
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Booking ID
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Date
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Time
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Customer
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Vehicle
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Service
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Revenue
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bookingsPageData.bookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-brand-panel-strong"
                >
                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <span className="font-medium text-primary">
                      {booking.id}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {booking.date}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {booking.time}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {booking.customer}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {booking.vehicle}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {booking.service}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <span className="font-semibold text-foreground">
                      {booking.revenue}
                    </span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${booking.statusClass}`}
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <Button className="rounded-lg bg-brand-panel-strong px-4 py-1.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h3 className="mb-2 font-semibold text-foreground">
            {bookingsPageData.calendarView.title}
          </h3>
          <p className="text-sm text-brand-muted">
            {bookingsPageData.calendarView.description}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
