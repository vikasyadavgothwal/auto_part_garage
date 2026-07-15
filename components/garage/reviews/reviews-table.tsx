"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { authenticatedFetch } from "@/lib/auth/client"
import type { ReviewsPageData } from "@/lib/garage-page-data"
import { appPath } from "@/lib/routes"

type ReviewsTableProps = {
  reviews: ReviewsPageData["reviews"]
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const router = useRouter()
  const [selectedReview, setSelectedReview] = useState<
    ReviewsPageData["reviews"][number] | null
  >(null)
  const [reply, setReply] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openReply(review: ReviewsPageData["reviews"][number]) {
    setSelectedReview(review)
    setReply(review.reply ?? "")
    setError(null)
  }

  function saveReply() {
    if (!selectedReview) return
    const isEditing = Boolean(selectedReview.reply)
    setError(null)

    startTransition(async () => {
      try {
        const response = await authenticatedFetch(
          appPath(`/api/reviews/${selectedReview.id}/reply`),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reply }),
          },
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null
          setError(payload?.message ?? "Unable to save reply")
          return
        }

        toast.success(isEditing ? "Reply updated successfully" : "Reply saved successfully")
        setSelectedReview(null)
        router.refresh()
      } catch {
        setError("Unable to reach the server. Please try again.")
      }
    })
  }

  return (
    <>
      <Card className="surface-card overflow-hidden py-0">
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
                <TableHead className={tableHeadLeftClass}>Reply</TableHead>
                <TableHead className={tableHeadLeftClass}>Status</TableHead>
                <TableHead className={tableHeadLeftClass}>{" "}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reviews.length === 0 ? (
                <TableRow className={tableRowClass}>
                  <TableCell className={tableCellMutedClass} colSpan={9}>
                    No reviews yet.
                  </TableCell>
                </TableRow>
              ) : null}

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

                  <TableCell className="max-w-[220px] px-6 py-4 text-sm text-brand-muted">
                    <span className="block truncate md:line-clamp-2">
                      {review.reply || "No reply yet"}
                    </span>
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
                      onClick={() => openReply(review)}
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

      <Dialog
        open={Boolean(selectedReview)}
        onOpenChange={(open) => {
          if (!open) setSelectedReview(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedReview?.actionLabel}</DialogTitle>
            <DialogDescription>
              Reply to {selectedReview?.customer} about {selectedReview?.service}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-3 text-sm text-brand-muted">
              {selectedReview?.comment}
            </div>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Garage reply
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="min-h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                maxLength={1000}
              />
            </label>

            {error ? (
              <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedReview(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || !reply.trim()}
              onClick={saveReply}
            >
              Save reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
