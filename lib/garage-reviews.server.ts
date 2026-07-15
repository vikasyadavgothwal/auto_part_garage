import { cookies } from "next/headers"

import { requestBackend } from "@/lib/auth/backend"
import { reviewsPageData, type ReviewsPageData } from "@/lib/garage-page-data"

export type GarageServiceReviewRecord = {
  id: string
  garageId: string
  serviceId: string
  customerId: string
  bookingId: string | null
  serviceName: string
  customerName: string
  rating: number
  comment: string
  garageReply: string | null
  garageReplyAt: string | null
  createdAt: string
  updatedAt: string
}

type ReviewsPayload = {
  ok: boolean
  reviews?: GarageServiceReviewRecord[]
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const statusClass = (hasReply: boolean) =>
  hasReply
    ? "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10"
    : "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10"

export async function getGarageReviews() {
  const response = await requestBackend("/api/v1/garage/reviews", {
    cookieHeader: (await cookies()).toString(),
  })

  if (!response.ok) return []

  const payload = (await response.json()) as ReviewsPayload
  return payload.reviews ?? []
}

export function buildReviewsPageData(
  reviews: GarageServiceReviewRecord[],
): ReviewsPageData {
  const total = reviews.length
  const average = total
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
    : 0
  const replied = reviews.filter((review) => Boolean(review.garageReply)).length
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length
    return {
      stars,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }
  })

  return {
    ...reviewsPageData,
    stats: [
      {
        title: "Average Rating",
        value: total ? average.toFixed(1) : "0.0",
        iconKey: "star",
        iconClass: "text-primary",
      },
      {
        title: "Total Reviews",
        value: String(total),
        iconKey: "messageSquare",
      },
      {
        title: "Replies Sent",
        value: String(replied),
        iconKey: "thumbsUp",
      },
      {
        title: "Response Rate",
        value: total ? `${Math.round((replied / total) * 100)}%` : "0%",
        valueClass: "text-brand-success",
      },
    ],
    ratingDistribution: distribution,
    reviews: reviews.map((review) => ({
      id: review.id,
      date: formatDate(review.createdAt),
      customer: review.customerName,
      service: review.serviceName,
      rating: review.rating,
      comment: review.comment,
      helpful: 0,
      status: review.garageReply ? "Replied" : "Needs Reply",
      statusClass: statusClass(Boolean(review.garageReply)),
      actionLabel: review.garageReply ? "Edit Reply" : "Reply",
      reply: review.garageReply,
    })),
  }
}
