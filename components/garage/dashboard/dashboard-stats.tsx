import {
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type {
  DashboardPageData,
  DashboardStatIconKey,
} from "@/lib/garage-page-data"

const dashboardStatIcons: Record<DashboardStatIconKey, LucideIcon> = {
  calendar: Calendar,
  clock: Clock,
  star: Star,
  checkCircle2: CheckCircle2,
}

type DashboardStatsProps = {
  stats: DashboardPageData["stats"]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
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
  )
}
