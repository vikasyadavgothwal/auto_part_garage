import { Star } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { ReviewsPageData } from "@/lib/garage-page-data"

type RatingDistributionCardProps = {
  distribution: ReviewsPageData["ratingDistribution"]
}

export function RatingDistributionCard({
  distribution,
}: RatingDistributionCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <h3 className="mb-4 font-semibold text-foreground">
          Rating Distribution
        </h3>

        <div className="space-y-3">
          {distribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-4">
              <div className="flex w-16 items-center gap-1">
                <span className="text-sm text-foreground">{item.stars}</span>
                <Star className="h-4 w-4 fill-primary text-primary" />
              </div>

              <div className="h-3 flex-1 rounded-full bg-background">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <div className="w-16 text-right text-sm text-brand-muted">
                {item.count} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
