import { Card, CardContent } from "@/components/ui/card"
import { ReviewStars } from "@/components/garage/shared/review-stars"
import { SectionHeader } from "@/components/garage/shared/section-header"
import type { DashboardPageData } from "@/lib/garage-page-data"
import { appRoutes } from "@/lib/routes"

type RecentReviewsCardProps = {
  reviews: DashboardPageData["reviews"]
}

export function RecentReviewsCard({ reviews }: RecentReviewsCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <SectionHeader
          title="Recent Reviews"
          actionLabel="View All"
          href={appRoutes.reviews}
          className="mb-6"
        />

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-4 text-sm text-brand-muted">
              No customer reviews yet.
            </div>
          ) : null}
          {reviews.map((review) => (
            <div
              key={`${review.name}-${review.date}`}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="font-semibold text-foreground">
                  {review.name}
                </div>
                <ReviewStars rating={review.rating} />
              </div>

              <p className="mb-2 text-sm text-brand-muted">
                {review.comment}
              </p>

              <div className="text-xs text-brand-muted">{review.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
