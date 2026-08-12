"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { BookingsPageData } from "@/lib/garage-page-data"
import { appPath } from "@/lib/routes"

type BookingsTableProps = {
  bookings: BookingsPageData["bookings"]
}

type Booking = BookingsPageData["bookings"][number]
type BookingStatus = NonNullable<Booking["rawStatus"]>
type PendingStatusChange = {
  booking: Booking
  status: BookingStatus
}

const statusOptions: Array<{ label: string; value: BookingStatus }> = [
  { label: "Mark pending", value: "pending" },
  { label: "Mark confirmed", value: "confirmed" },
  { label: "Mark completed", value: "completed" },
  { label: "Mark cancelled", value: "cancelled" },
]

function formatStatus(value: BookingStatus) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function requiresCompletionOtp(booking: Booking, status: BookingStatus) {
  return status === "completed" && Boolean(booking.customerId)
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">
        {value || "Not added"}
      </div>
    </div>
  )
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [pendingStatusChange, setPendingStatusChange] =
    useState<PendingStatusChange | null>(null)
  const [statusError, setStatusError] = useState("")
  const [completionOtp, setCompletionOtp] = useState("")
  const [otpMessage, setOtpMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function requestStatusChange(booking: Booking, status: BookingStatus) {
    setPendingStatusChange({ booking, status })
    setStatusError("")
    setCompletionOtp("")
    setOtpMessage("")
  }

  function closeStatusDialog() {
    if (isPending) return
    setPendingStatusChange(null)
    setStatusError("")
    setCompletionOtp("")
    setOtpMessage("")
  }

  function sendCompletionOtp() {
    if (!pendingStatusChange?.booking.backendId) return

    setStatusError("")
    setOtpMessage("")
    startTransition(async () => {
      const response = await fetch(
        appPath(
          `/api/bookings/${pendingStatusChange.booking.backendId}/completion-otp`,
        ),
        { method: "POST" },
      )
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null

      if (!response.ok) {
        setStatusError(payload?.message ?? "Unable to send completion OTP")
        return
      }

      setOtpMessage(payload?.message ?? "Completion OTP sent to customer email")
    })
  }

  function updateStatus() {
    if (!pendingStatusChange) return

    const { booking, status } = pendingStatusChange

    if (!booking.backendId) {
      setStatusError("Booking cannot be updated from static data.")
      return
    }

    if (requiresCompletionOtp(booking, status) && !/^\d{6}$/.test(completionOtp.trim())) {
      setStatusError("Enter the 6-digit OTP sent to the customer")
      return
    }

    startTransition(async () => {
      const response = await fetch(appPath(`/api/bookings/${booking.backendId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(requiresCompletionOtp(booking, status)
            ? { completionOtp: completionOtp.trim() }
            : {}),
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setStatusError(payload?.message ?? "Unable to update booking status")
        return
      }

      setPendingStatusChange(null)
      setStatusError("")
      setCompletionOtp("")
      setOtpMessage("")
      router.refresh()
    })
  }

  return (
    <>
      <Card className="surface-card overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={tableHeaderRowClass}>
                <TableHead className={tableHeadLeftClass}>Booking ID</TableHead>
                <TableHead className={tableHeadLeftClass}>Date</TableHead>
                <TableHead className={tableHeadLeftClass}>Time</TableHead>
                <TableHead className={tableHeadLeftClass}>Customer</TableHead>
                <TableHead className={tableHeadLeftClass}>Vehicle</TableHead>
                <TableHead className={tableHeadLeftClass}>Service</TableHead>
                <TableHead className={tableHeadLeftClass}>Revenue</TableHead>
                <TableHead className={tableHeadLeftClass}>Status</TableHead>
                <TableHead className={tableHeadLeftClass}>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bookings.length === 0 ? (
                <TableRow className={tableRowClass}>
                  <TableCell
                    className={`${tableCellMutedClass} text-center`}
                    colSpan={9}
                  >
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : null}

              {bookings.map((booking) => (
                <TableRow key={booking.id} className={tableRowClass}>
                  <TableCell className={tableCellMutedClass}>
                    <span className="font-medium text-primary">
                      {booking.id}
                    </span>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {booking.date}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {booking.time}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {booking.customer}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {booking.vehicle}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    {booking.service}
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <span className="font-semibold text-foreground">
                      {booking.revenue}
                    </span>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${booking.statusClass}`}
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>

                  <TableCell className={tableCellMutedClass}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={isPending}
                          aria-label={`Actions for ${booking.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Booking actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onSelect={() => setSelectedBooking(booking)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {statusOptions.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            disabled={booking.rawStatus === option.value}
                            onSelect={() =>
                              requestStatusChange(booking, option.value)
                            }
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>
              {selectedBooking?.id} · {selectedBooking?.status}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Customer" value={selectedBooking.customer} />
              <DetailRow label="Email" value={selectedBooking.customerEmail} />
              <DetailRow label="Mobile" value={selectedBooking.customerPhone} />
              <DetailRow label="Vehicle" value={selectedBooking.vehicle} />
              <DetailRow label="VIN" value={selectedBooking.vehicleVin} />
              <DetailRow label="Service" value={selectedBooking.service} />
              <DetailRow label="Duration" value={selectedBooking.duration} />
              <DetailRow label="Revenue" value={selectedBooking.revenue} />
              <DetailRow label="Date" value={selectedBooking.date} />
              <DetailRow label="Time" value={selectedBooking.time} />
              <div className="sm:col-span-2">
                <DetailRow label="Notes" value={selectedBooking.notes} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(open) => {
          if (!open) closeStatusDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update booking status?</DialogTitle>
            <DialogDescription>
              Change {pendingStatusChange?.booking.id} to{" "}
              {pendingStatusChange
                ? formatStatus(pendingStatusChange.status)
                : "the selected status"}
              .
            </DialogDescription>
          </DialogHeader>

          {pendingStatusChange ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
              <div className="font-medium text-foreground">
                {pendingStatusChange.booking.customer}
              </div>
              <div className="mt-1 text-muted-foreground">
                {pendingStatusChange.booking.service} ·{" "}
                {pendingStatusChange.booking.date} ·{" "}
                {pendingStatusChange.booking.time}
              </div>
            </div>
          ) : null}

          {pendingStatusChange?.status === "completed" &&
          !pendingStatusChange.booking.customerId ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
              This offline appointment was created by the garage, so customer
              OTP is not required to complete it.
            </div>
          ) : null}

          {pendingStatusChange &&
          requiresCompletionOtp(
            pendingStatusChange.booking,
            pendingStatusChange.status,
          ) ? (
            <div className="space-y-3 rounded-lg border border-border/70 p-3">
              <div className="space-y-1">
                <Label htmlFor="completion-otp">Customer completion OTP</Label>
                <p className="text-xs text-muted-foreground">
                  Send an OTP to the customer email and enter it here after the
                  customer confirms the service is complete.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="completion-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={completionOtp}
                  onChange={(event) =>
                    setCompletionOtp(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="6-digit OTP"
                  className="sm:max-w-40"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={sendCompletionOtp}
                >
                  {isPending ? "Sending..." : "Send OTP"}
                </Button>
              </div>
              {otpMessage ? (
                <p className="text-sm font-medium text-emerald-600">
                  {otpMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {statusError ? (
            <p className="text-sm font-medium text-destructive">
              {statusError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={closeStatusDialog}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={updateStatus}>
              {isPending ? "Updating..." : "Update status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
