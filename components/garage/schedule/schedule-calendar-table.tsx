import { Clock, Plus } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { ScheduleAppointment, SchedulePageData } from "@/lib/garage-page-data"

type AppointmentCardProps = ScheduleAppointment

function AppointmentCard({
  customer,
  service,
  duration,
}: AppointmentCardProps) {
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

function ClosedSlot() {
  return (
    <button
      type="button"
      className="flex min-h-[80px] w-full cursor-default items-center justify-center rounded-lg border border-destructive/40 bg-destructive/10 text-xs font-semibold uppercase tracking-wide text-destructive"
      disabled
    >
      Close
    </button>
  )
}

type ScheduleCalendarTableProps = {
  days: SchedulePageData["days"]
  timeSlots: SchedulePageData["timeSlots"]
  appointments: SchedulePageData["appointments"]
  dayAvailability: SchedulePageData["dayAvailability"]
}

export function ScheduleCalendarTable({
  days,
  timeSlots,
  appointments,
  dayAvailability,
}: ScheduleCalendarTableProps) {
  return (
    <Card className="surface-card min-w-0 overflow-hidden py-0">
      <div className="w-full max-w-full overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-background p-4 text-left text-sm font-semibold text-brand-muted">
                Time
              </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="min-w-[150px] bg-background p-4 text-center text-sm font-semibold text-foreground"
                  >
                    <span>{day}</span>
                    {dayAvailability[day] === false ? (
                      <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-destructive">
                        Close
                      </span>
                    ) : null}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-border">
                <td className="sticky left-0 bg-background p-4 text-sm text-brand-muted">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {time}
                  </div>
                </td>

                {days.map((day) => {
                  const slot = appointments[time]?.[day]
                  const isOpen = dayAvailability[day] ?? true

                  return (
                    <td key={`${time}-${day}`} className="p-2 align-top">
                      {slot ? (
                        <AppointmentCard
                          customer={slot.customer}
                          service={slot.service}
                          duration={slot.duration}
                        />
                      ) : isOpen ? (
                        <EmptySlot />
                      ) : (
                        <ClosedSlot />
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
  )
}
