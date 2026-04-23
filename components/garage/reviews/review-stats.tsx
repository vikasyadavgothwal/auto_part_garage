import {
  MessageSquare,
  Star,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react"

import { SummaryStatCard } from "@/components/garage/shared/stat-card"
import type {
  ReviewsPageData,
  ReviewsStatIconKey,
} from "@/lib/garage-page-data"

const reviewStatIcons: Record<ReviewsStatIconKey, LucideIcon> = {
  star: Star,
  messageSquare: MessageSquare,
  thumbsUp: ThumbsUp,
}

type ReviewStatsProps = {
  stats: ReviewsPageData["stats"]
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.iconKey ? reviewStatIcons[item.iconKey] : undefined

        return (
          <SummaryStatCard
            key={item.title}
            title={item.title}
            value={item.value}
            valueClass={item.valueClass}
            icon={Icon}
            iconClass={item.iconClass}
          />
        )
      })}
    </div>
  )
}
