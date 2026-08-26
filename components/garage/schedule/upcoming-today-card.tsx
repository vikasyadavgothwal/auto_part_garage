import { Card, CardContent } from "@/components/ui/card"
import type { SchedulePageData } from "@/lib/garage-page-data"

type UpcomingTodayCardProps = {
  appointments: SchedulePageData["upcomingToday"]
}

export function UpcomingTodayCard({ appointments }: UpcomingTodayCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold text-foreground">
          Upcoming Today
        </h3>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-brand-muted">
              No upcoming appointments today.
            </div>
          ) : null}
          {appointments.map((item) => (
            <div
              key={`${item.time}-${item.customer}`}
              className="rounded-lg border border-border bg-background p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="font-medium text-foreground">{item.time}</div>
                <div className="text-xs text-primary">{item.duration}</div>
              </div>
              <div className="text-sm text-brand-muted">{item.customer}</div>
              <div className="text-xs text-brand-muted">{item.service}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
