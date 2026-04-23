import { Calendar, type LucideIcon } from "lucide-react"

import { SummaryStatCard } from "@/components/garage/shared/stat-card"
import type {
  BookingStatIconKey,
  BookingsPageData,
} from "@/lib/garage-page-data"

const bookingStatIcons: Record<BookingStatIconKey, LucideIcon> = {
  calendar: Calendar,
}

type BookingStatsProps = {
  stats: BookingsPageData["stats"]
}

export function BookingStats({ stats }: BookingStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.iconKey ? bookingStatIcons[item.iconKey] : undefined

        return (
          <SummaryStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            valueClass={item.valueClass}
            icon={item.showIcon ? Icon : undefined}
            iconClass="text-primary"
          />
        )
      })}
    </div>
  )
}
