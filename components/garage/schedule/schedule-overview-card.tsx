import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SchedulePageData } from "@/lib/garage-page-data"

type ScheduleOverviewCardProps = {
  weekLabel: SchedulePageData["weekLabel"]
  weekStats: SchedulePageData["weekStats"]
}

export function ScheduleOverviewCard({
  weekLabel,
  weekStats,
}: ScheduleOverviewCardProps) {
  return (
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
              {weekLabel}
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
          {weekStats.map((item) => (
            <div key={item.label} className="rounded-lg bg-background p-4">
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
  )
}
