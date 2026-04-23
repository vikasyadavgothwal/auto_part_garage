import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReviewStars } from "@/components/garage/shared/review-stars"
import {
  tableCellMutedClass,
  tableHeadLeftClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import type { ReviewsPageData } from "@/lib/garage-page-data"

type ReviewsTableProps = {
  reviews: ReviewsPageData["reviews"]
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  return (
    <Card className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className={tableHeaderRowClass}>
              <TableHead className={tableHeadLeftClass}>Review ID</TableHead>
              <TableHead className={tableHeadLeftClass}>Date</TableHead>
              <TableHead className={tableHeadLeftClass}>Customer</TableHead>
              <TableHead className={tableHeadLeftClass}>Service</TableHead>
              <TableHead className={tableHeadLeftClass}>Rating</TableHead>
              <TableHead className={tableHeadLeftClass}>Comment</TableHead>
              <TableHead className={tableHeadLeftClass}>Helpful</TableHead>
              <TableHead className={tableHeadLeftClass}>Status</TableHead>
              <TableHead className={tableHeadLeftClass}>{" "}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id} className={tableRowClass}>
                <TableCell className={tableCellMutedClass}>
                  <span className="font-medium text-primary">
                    {review.id}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {review.date}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {review.customer}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {review.service}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <ReviewStars rating={review.rating} />
                </TableCell>

                <TableCell className="max-w-[220px] px-6 py-4 text-sm text-brand-muted">
                  <span className="block truncate md:line-clamp-2">
                    {review.comment}
                  </span>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  {review.helpful}
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${review.statusClass}`}
                  >
                    {review.status}
                  </Badge>
                </TableCell>

                <TableCell className={tableCellMutedClass}>
                  <Button
                    type="button"
                    className="rounded-lg bg-brand-panel-strong px-4 py-1.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                  >
                    {review.actionLabel}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
