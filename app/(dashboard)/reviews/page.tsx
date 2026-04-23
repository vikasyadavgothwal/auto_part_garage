import { RatingDistributionCard } from "@/components/garage/reviews/rating-distribution-card"
import { ReputationTipsCard } from "@/components/garage/reviews/reputation-tips-card"
import { ReviewStats } from "@/components/garage/reviews/review-stats"
import { ReviewsTable } from "@/components/garage/reviews/reviews-table"
import { PageHeading } from "@/components/garage/shared/page-heading"
import { reviewsPageData } from "@/lib/garage-page-data"

export default function GarageReviewsPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        title={reviewsPageData.title}
        description={reviewsPageData.description}
      />

      <ReviewStats stats={reviewsPageData.stats} />
      <RatingDistributionCard
        distribution={reviewsPageData.ratingDistribution}
      />
      <ReviewsTable reviews={reviewsPageData.reviews} />
      <ReputationTipsCard tips={reviewsPageData.reputationTips} />
    </div>
  )
}
