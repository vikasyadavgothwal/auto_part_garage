"use client"

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { schedulePageData } from "@/lib/garage-page-data"

function AppointmentCard({
  customer,
  service,
  duration,
}: {
  customer: string
  service: string
  duration: string
}) {
  return (
    <button
      type="button"
      className="w-full rounded-lg border border-primary/20 bg-primary/10 p-3 text-left transition-all hover:border-primary"
    >
      <div className="mb-1 text-sm font-semibold text-foreground">
        {customer}
      </div>
      <div className="mb-1 text-xs text-brand-muted">{service}</div>
      <div className="text-xs text-primary">{duration}</div>
    </button>
  )
}

function EmptySlot() {
  return (
    <button
      type="button"
      className="flex min-h-[80px] w-full items-center justify-center rounded-lg border border-border bg-background opacity-50 transition-all hover:border-primary hover:opacity-100"
    >
      <Plus className="h-4 w-4 text-brand-muted" />
    </button>
  )
}

export default function GarageSchedulePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {schedulePageData.title}
          </h1>
          <p className="text-brand-muted">{schedulePageData.description}</p>
        </div>

        <Button className="h-auto w-full gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-brand-primary-hover sm:w-auto">
          <Plus className="h-5 w-5" />
          {schedulePageData.primaryActionLabel}
        </Button>
      </div>

      <Card className="surface-card">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Button
              variant="outline"
              size="icon"
              className="border-border bg-brand-panel-strong text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-center text-lg font-bold text-foreground sm:text-xl">
                {schedulePageData.weekLabel}
              </h2>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="border-border bg-brand-panel-strong text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {schedulePageData.weekStats.map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-background p-4"
              >
                <div className="mb-1 text-sm text-brand-muted">
                  {item.label}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 bg-background p-4 text-left text-sm font-semibold text-brand-muted">
                  Time
                </th>
                {schedulePageData.days.map((day) => (
                  <th
                    key={day}
                    className="min-w-[150px] bg-background p-4 text-center text-sm font-semibold text-foreground"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {schedulePageData.timeSlots.map((time) => (
                <tr key={time} className="border-b border-border">
                  <td className="sticky left-0 bg-background p-4 text-sm text-brand-muted">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                  </td>

                  {schedulePageData.days.map((day) => {
                    const slot = schedulePageData.appointments[time]?.[day]

                    return (
                      <td key={`${time}-${day}`} className="p-2 align-top">
                        {slot ? (
                          <AppointmentCard
                            customer={slot.customer}
                            service={slot.service}
                            duration={slot.duration}
                          />
                        ) : (
                          <EmptySlot />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold text-foreground">
            Schedule Legend
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-primary/20 bg-primary/10" />
              <span className="text-sm text-brand-muted">
                Booked Appointment
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-border bg-background" />
              <span className="text-sm text-brand-muted">Available Slot</span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-brand-muted">
                Operating Hours: 8 AM - 6 PM
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="surface-card">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground">
              Schedule Settings
            </h3>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-lg bg-background p-3 text-left transition-all hover:border hover:border-primary"
              >
                <div className="mb-1 font-medium text-foreground">
                  Operating Hours
                </div>
                <div className="text-sm text-brand-muted">
                  Set your daily working hours
                </div>
              </button>

              <button
                type="button"
                className="w-full rounded-lg bg-background p-3 text-left transition-all hover:border hover:border-primary"
              >
                <div className="mb-1 font-medium text-foreground">
                  Service Duration
                </div>
                <div className="text-sm text-brand-muted">
                  Configure default time slots
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-foreground">
              Upcoming Today
            </h3>

            <div className="space-y-3">
              {schedulePageData.upcomingToday.map((item) => (
                <div
                  key={`${item.time}-${item.customer}`}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <div className="font-medium text-foreground">
                      {item.time}
                    </div>
                    <div className="text-xs text-primary">{item.duration}</div>
                  </div>
                  <div className="text-sm text-brand-muted">{item.customer}</div>
                  <div className="text-xs text-brand-muted">{item.service}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
