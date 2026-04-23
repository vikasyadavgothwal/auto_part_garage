import { Card, CardContent } from "@/components/ui/card"
import type { DashboardPageData } from "@/lib/garage-page-data"

type MonthlyPerformanceCardProps = {
  performance: DashboardPageData["performance"]
}

export function MonthlyPerformanceCard({
  performance,
}: MonthlyPerformanceCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h2 className="mb-6 text-xl font-bold text-foreground">
          This Month&apos;s Performance
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {performance.map((item) => (
            <div key={item.title}>
              <div className="mb-2 text-sm text-brand-muted">
                {item.title}
              </div>
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
  )
}
