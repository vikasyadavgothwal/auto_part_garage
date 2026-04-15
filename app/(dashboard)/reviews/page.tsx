"use client"

import { MessageSquare, Star, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { reviewsPageData } from "@/lib/garage-page-data"

const reviewStatIcons = {
  star: Star,
  messageSquare: MessageSquare,
  thumbsUp: ThumbsUp,
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: rating }).map((_, index) => (
        <Star
          key={index}
          className="h-4 w-4 fill-primary text-primary"
        />
      ))}
    </div>
  )
}

export default function GarageReviewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          {reviewsPageData.title}
        </h1>
        <p className="text-brand-muted">{reviewsPageData.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {reviewsPageData.stats.map((item) => {
          const Icon = item.iconKey ? reviewStatIcons[item.iconKey] : undefined

          return (
            <Card key={item.title} className="surface-card">
              <CardContent className="p-6">
                {Icon ? (
                  <div className="mb-2 flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${item.iconClass}`} />
                    <div className="text-sm text-brand-muted">{item.title}</div>
                  </div>
                ) : (
                  <div className="mb-2 text-sm text-brand-muted">
                    {item.title}
                  </div>
                )}

                <div
                  className={`text-3xl font-bold ${
                    item.valueClass ?? "text-foreground"
                  }`}
                >
                  {item.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold text-foreground">
            Rating Distribution
          </h3>

          <div className="space-y-3">
            {reviewsPageData.ratingDistribution.map((item) => (
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

      <Card className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-background hover:bg-background">
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Review ID
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Date
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Customer
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Service
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Rating
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Comment
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Helpful
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-sm font-semibold text-brand-muted">
                  {" "}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reviewsPageData.reviews.map((review) => (
                <TableRow
                  key={review.id}
                  className="cursor-pointer border-b border-border transition-colors hover:bg-brand-panel-strong"
                >
                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <span className="font-medium text-primary">{review.id}</span>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {review.date}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {review.customer}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {review.service}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <ReviewStars rating={review.rating} />
                  </TableCell>

<TableCell className="max-w-[220px] px-6 py-4 text-sm text-brand-muted">
  <span className="block truncate md:line-clamp-2">
    {review.comment}
  </span>
</TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    {review.helpful}
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${review.statusClass}`}
                    >
                      {review.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4 text-sm text-brand-muted">
                    <Button className="rounded-lg bg-brand-panel-strong px-4 py-1.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground">
                      {review.actionLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="surface-card">
        <CardContent className="p-6">
          <h3 className="mb-2 font-semibold text-foreground">
            Building Your Reputation
          </h3>

          <ul className="space-y-2 text-sm text-brand-muted">
            {reviewsPageData.reputationTips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
