import { SummaryStatCard } from "@/components/garage/shared/stat-card"
import type { ServicesPageData } from "@/lib/garage-page-data"

type ServiceStatsProps = {
  stats: ServicesPageData["stats"]
}

export function ServiceStats({ stats }: ServiceStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <SummaryStatCard
          key={item.title}
          title={item.title}
          value={item.value}
          valueClass={item.valueClass}
        />
      ))}
    </div>
  )
}
