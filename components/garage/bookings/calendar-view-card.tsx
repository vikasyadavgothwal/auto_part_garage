import { Card, CardContent } from "@/components/ui/card"
import type { BookingsPageData } from "@/lib/garage-page-data"

type CalendarViewCardProps = {
  calendarView: BookingsPageData["calendarView"]
}

export function CalendarViewCard({ calendarView }: CalendarViewCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-2 font-semibold text-foreground">
          {calendarView.title}
        </h3>
        <p className="text-sm text-brand-muted">
          {calendarView.description}
        </p>
      </CardContent>
    </Card>
  )
}
