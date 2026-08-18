"use client"

import { useState, useTransition } from "react"
import { MessageSquare, Pen, Star, Trash2 } from "lucide-react"
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
import {
  tableCellMutedClass,
  tableHeadLeftClass,
  tableHeaderRowClass,
  tableRowClass,
} from "@/components/garage/shared/table-styles"
import { TablePagination } from "@/components/garage/shared/table-pagination"
import { authenticatedFetch } from "@/lib/auth/client"
import type {
  GarageServiceReview,
  GarageServiceTableItem,
} from "@/lib/garage-services"
import type { PaginationMeta } from "@/lib/pagination"
import { appPath } from "@/lib/routes"

type ServicesTableProps = {
  services: GarageServiceTableItem[]
  pagination: PaginationMeta
  deletingId?: string | null
  onEdit?: (service: GarageServiceTableItem) => void
  onDelete?: (service: GarageServiceTableItem) => void
  onReviewReplySaved?: (
    serviceId: string,
    review: GarageServiceReview,
  ) => void
}

export function ServicesTable({
  services,
  pagination,
  deletingId,
  onEdit,
  onDelete,
  onReviewReplySaved,
}: ServicesTableProps) {
  const [selectedService, setSelectedService] =
    useState<GarageServiceTableItem | null>(null)
  const [selectedReview, setSelectedReview] =
    useState<GarageServiceReview | null>(null)
  const [reply, setReply] = useState("")
  const [, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const openReviews = (service: GarageServiceTableItem) => {
    setSelectedService(service)
    setSelectedReview(null)
    setReply("")
    setError("")
  }

  const openReply = (review: GarageServiceReview) => {
    setSelectedReview(review)
    setReply(review.garageReply ?? "")
    setError("")
  }

  const saveReply = () => {
    if (!selectedService || !selectedReview) return
    if (!reply.trim()) {
      const message = "Reply is required"
      setError(message)
      toast.error(message)
      return
    }
    const isEditing = Boolean(selectedReview.garageReply)
    setError("")

    startTransition(async () => {
      try {
        const response = await authenticatedFetch(
          appPath(`/api/reviews/${selectedReview.id}/reply`),
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reply }),
          },
        )
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; review?: GarageServiceReview; message?: string }
          | null

        if (!response.ok || !payload?.ok || !payload.review) {
          const message = payload?.message ?? "Unable to save reply"
          setError(message)
          toast.error(message)
          return
        }

        const updatedReview: GarageServiceReview = {
          id: payload.review.id,
          customerName: payload.review.customerName,
          rating: payload.review.rating,
          comment: payload.review.comment,
          garageReply: payload.review.garageReply,
          createdAt: payload.review.createdAt,
          updatedAt: payload.review.updatedAt,
        }

        onReviewReplySaved?.(selectedService.databaseId, updatedReview)
        setSelectedService((current) =>
          current
            ? {
                ...current,
                reviews: current.reviews.map((item) =>
                  item.id === updatedReview.id ? updatedReview : item,
                ),
              }
            : current,
        )
        setSelectedReview(updatedReview)
        setReply(updatedReview.garageReply ?? "")
        toast.success(isEditing ? "Reply updated successfully" : "Reply saved successfully")
      } catch {
        const message = "Unable to reach the server. Please try again."
        setError(message)
        toast.error(message)
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
                <TableHead className={tableHeadLeftClass}>Service ID</TableHead>
                <TableHead className={tableHeadLeftClass}>
                  Service Name
                </TableHead>
                <TableHead className={tableHeadLeftClass}>Category</TableHead>
                <TableHead className={tableHeadLeftClass}>Duration</TableHead>
                <TableHead className={tableHeadLeftClass}>Price</TableHead>
                <TableHead className={tableHeadLeftClass}>Bookings</TableHead>
                <TableHead className={tableHeadLeftClass}>Reviews</TableHead>
                <TableHead className={tableHeadLeftClass}>Status</TableHead>
                <TableHead className={tableHeadLeftClass}>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {services.length === 0 ? (
                <TableRow className={tableRowClass}>
                  <TableCell
                    colSpan={9}
                    className={`${tableCellMutedClass} py-8 text-center`}
                  >
                    No services found.
                  </TableCell>
                </TableRow>
              ) : null}

              {services.map((service) => (
                <TableRow key={service.databaseId} className={tableRowClass}>
                  <TableCell className={tableCellMutedClass}>
                    <span className="font-medium text-primary">
                      {service.id}
                    </span>
                  </TableCell>

                  <TableCell className={`${tableCellMutedClass} whitespace-normal`}>
                    <div>
                      <p>{service.name}</p>
                      {service.isPlanSuspended ? (
                        <p className="mt-1 max-w-md whitespace-normal text-xs leading-5 text-amber-300">
                          {service.planSuspensionReason || "Temporarily inactive because this service is over your current plan limit."}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {service.category}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {service.duration}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <span className="font-semibold text-foreground">
                      {service.price}
                    </span>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {service.bookings}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <button
                      type="button"
                      disabled={service.reviewCount === 0}
                      onClick={() => openReviews(service)}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-panel-strong px-3 py-1.5 text-sm text-foreground transition-colors enabled:hover:bg-primary enabled:hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {service.reviewCount
                        ? `${service.ratingAverage.toFixed(1)} (${service.reviewCount})`
                        : "No reviews"}
                    </button>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <Badge
                      className={`rounded-full px-2 py-1 text-xs font-medium ${service.statusClass}`}
                    >
                      {service.status}
                    </Badge>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={service.isPlanSuspended}
                        onClick={() => onEdit?.(service)}
                        aria-label={`Edit ${service.name}`}
                        title={service.isPlanSuspended ? "Upgrade your plan to edit this suspended service." : `Edit ${service.name}`}
                        className="rounded bg-brand-panel-strong p-2 text-foreground transition-all hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-brand-panel-strong disabled:hover:text-foreground"
                      >
                        <Pen className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={deletingId === service.databaseId || service.isPlanSuspended}
                        onClick={() => onDelete?.(service)}
                        aria-label={`Delete ${service.name}`}
                        title={service.isPlanSuspended ? "Suspended services are preserved and cannot be deleted while over plan limit." : `Delete ${service.name}`}
                        className="rounded bg-brand-panel-strong p-2 text-foreground transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-brand-panel-strong"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination pagination={pagination} />
      </Card>

      <Dialog
        open={Boolean(selectedService)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedService(null)
            setSelectedReview(null)
            setReply("")
            setError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedService?.name} reviews</DialogTitle>
            <DialogDescription>
              Reply once to each customer review, or edit the existing reply.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
              {selectedService?.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {review.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star
                            key={index}
                            className="h-3.5 w-3.5 fill-primary"
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openReply(review)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {review.garageReply ? "Edit reply" : "Reply"}
                    </Button>
                  </div>

                  <p className="mt-3 text-sm text-brand-muted">
                    {review.comment}
                  </p>

                  {review.garageReply ? (
                    <div className="mt-3 rounded-lg border border-border bg-brand-panel p-3 text-sm text-brand-muted">
                      <span className="font-semibold text-foreground">
                        Your reply:
                      </span>{" "}
                      {review.garageReply}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              {selectedReview ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {selectedReview.garageReply ? "Edit reply" : "Reply"}
                    </div>
                    <p className="text-xs text-brand-muted">
                      {selectedReview.customerName}
                    </p>
                  </div>

                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    maxLength={1000}
                    required
                    className="min-h-32 w-full rounded-lg border border-border bg-brand-panel px-3 py-2 text-sm outline-none focus:border-primary"
                  />


                  <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedReview(null)
                        setReply("")
                        setError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending || !reply.trim()}
                      onClick={saveReply}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-sm text-brand-muted">
                  Select a review to reply or edit your reply.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
