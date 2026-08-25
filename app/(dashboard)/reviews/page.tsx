import { RatingDistributionCard } from "@/components/garage/reviews/rating-distribution-card"
import { ReputationTipsCard } from "@/components/garage/reviews/reputation-tips-card"
import { ReviewStats } from "@/components/garage/reviews/review-stats"
import { ReviewsTable } from "@/components/garage/reviews/reviews-table"
import { AccessRestrictedCard } from "@/components/garage/shared/access-restricted-card"
import { PageHeading } from "@/components/garage/shared/page-heading"
import { getGarageBusinessAccess } from "@/lib/business-access.server"
import {
  buildReviewsPageData,
  getGarageReviews,
  getGarageReviewsPage,
} from "@/lib/garage-reviews.server"
import { pageFromSearchParams, type PageSearchParams } from "@/lib/pagination"

export const dynamic = "force-dynamic"

export default async function GarageReviewsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const access = await getGarageBusinessAccess()
  if (!access.canView("reviews")) return <AccessRestrictedCard message="You do not have permission to view Garage reviews." />

  const page = pageFromSearchParams(await searchParams)
  const [allReviews, tablePage] = await Promise.all([
    getGarageReviews(),
    getGarageReviewsPage(page),
  ])
  const reviewsPageData = buildReviewsPageData(allReviews)
  const tableData = buildReviewsPageData(tablePage.reviews)

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
      <ReviewsTable
        reviews={tableData.reviews}
        pagination={tablePage.pagination}
      />
      <ReputationTipsCard tips={reviewsPageData.reputationTips} />
    </div>
  )
}
