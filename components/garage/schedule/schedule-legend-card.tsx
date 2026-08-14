import { Clock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function ScheduleLegendCard() {
  return (
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
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded border border-destructive/40 bg-destructive/10" />
            <span className="text-sm text-brand-muted">Closed Day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
