"use client"

import { useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authenticatedFetch } from "@/lib/auth/client"
import type { GarageBookingRecord } from "@/lib/garage-bookings.server"
import type { GarageServiceTableItem } from "@/lib/garage-services"
import { appPath } from "@/lib/routes"

type OfflineAppointmentDialogProps = {
  title: string
  description: string
  actionLabel: string
  services: GarageServiceTableItem[]
  bookings: GarageBookingRecord[]
}

type OfflineAppointmentForm = {
  serviceId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleYear: string
  vehicleMake: string
  vehicleModel: string
  vehicleVin: string
  bookingDate: string
  bookingTime: string
  notes: string
}

type BookingMutationPayload = {
  ok: boolean
  message?: string
}

const emptyForm: OfflineAppointmentForm = {
  serviceId: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  vehicleYear: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleVin: "",
  bookingDate: "",
  bookingTime: "",
  notes: "",
}

const maxLengths: Partial<Record<keyof OfflineAppointmentForm, number>> = {
  customerName: 160,
  customerEmail: 180,
  customerPhone: 15,
  vehicleYear: 4,
  vehicleMake: 80,
  vehicleModel: 80,
  vehicleVin: 17,
  notes: 500,
}

const digitsOnlyFields = new Set<keyof OfflineAppointmentForm>([
  "customerPhone",
  "vehicleYear",
])

const slotTimes = Array.from({ length: 35 }, (_, index) => {
  const totalMinutes = 9 * 60 + index * 15
  const hour24 = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const period = hour24 >= 12 ? "PM" : "AM"
  const hour = hour24 % 12 || 12
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`
})

const slotGroups = [
  { label: "Morning", slots: slotTimes.filter((time) => time.endsWith("AM")) },
  {
    label: "Afternoon",
    slots: slotTimes.filter((time) => {
      const hour = Number(time.split(":")[0])
      return time.endsWith("PM") && (hour === 12 || hour < 5)
    }),
  },
  { label: "Evening", slots: slotTimes.filter((time) => time.startsWith("5:")) },
]

const sanitizeValue = (field: keyof OfflineAppointmentForm, value: string) => {
  if (digitsOnlyFields.has(field)) {
    return value.replace(/\D/g, "")
  }
  if (field === "vehicleVin") {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  }
  return value
}

export function OfflineAppointmentDialog({
  title,
  description,
  actionLabel,
  services,
  bookings,
}: OfflineAppointmentDialogProps) {
  const router = useRouter()
  const activeServices = useMemo(
    () => services.filter((service) => service.statusValue === "active"),
    [services],
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<OfflineAppointmentForm>({
    ...emptyForm,
    serviceId: activeServices[0]?.databaseId ?? "",
  })
  const [error, setError] = useState("")
  const unavailableTimes = useMemo(() => {
    if (!form.bookingDate) return new Set<string>()
    return new Set(
      bookings
        .filter(
          (booking) =>
            booking.bookingDate === form.bookingDate &&
            booking.status !== "cancelled" &&
            Boolean(booking.bookingTime),
        )
        .map((booking) => booking.bookingTime as string),
    )
  }, [bookings, form.bookingDate])

  const updateForm = (field: keyof OfflineAppointmentForm, value: string) => {
    const maxLength = maxLengths[field]
    const sanitized = sanitizeValue(field, value)
    setForm((current) => ({
      ...current,
      [field]: maxLength ? sanitized.slice(0, maxLength) : sanitized,
      ...(field === "bookingDate" ? { bookingTime: "" } : {}),
    }))
  }

  const openDialog = () => {
    setForm({ ...emptyForm, serviceId: activeServices[0]?.databaseId ?? "" })
    setError("")
    setIsOpen(true)
  }

  const validate = () => {
    if (!form.serviceId) return "Select a service"
    if (form.customerName.trim().length < 2) return "Customer name is required"
    if (!/^\d{7,15}$/.test(form.customerPhone)) {
      return "Mobile number must contain 7 to 15 digits"
    }
    if (
      form.customerEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())
    ) {
      return "Enter a valid email"
    }
    if (!form.bookingDate) return "Appointment date is required"
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const appointmentDate = new Date(`${form.bookingDate}T00:00:00`)
    if (appointmentDate < today) return "Appointment date cannot be in the past"
    if (!form.bookingTime) return "Appointment time is required"
    if (unavailableTimes.has(form.bookingTime)) {
      return "This appointment slot is already booked"
    }
    if (form.vehicleYear) {
      const year = Number(form.vehicleYear)
      const maxYear = new Date().getFullYear() + 1
      if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
        return `Vehicle year must be between 1900 and ${maxYear}`
      }
    }
    if (form.vehicleVin && !/^[A-HJ-NPR-Z0-9]{5,17}$/.test(form.vehicleVin)) {
      return "VIN must be 5 to 17 letters/numbers and cannot include I, O, or Q"
    }
    return ""
  }

  const saveAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await authenticatedFetch(appPath("/api/bookings"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          vehicleYear: form.vehicleYear.trim(),
          vehicleMake: form.vehicleMake.trim(),
          vehicleModel: form.vehicleModel.trim(),
          vehicleVin: form.vehicleVin.trim(),
          notes: form.notes.trim(),
          bookingTime: form.bookingTime,
        }),
      })
      const payload = (await response.json()) as BookingMutationPayload
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to add appointment")
      }

      toast.success("Offline appointment added")
      setIsOpen(false)
      setForm({ ...emptyForm, serviceId: activeServices[0]?.databaseId ?? "" })
      router.refresh()
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Unable to add appointment"
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-brand-muted">{description}</p>
        </div>

        <Button
          type="button"
          onClick={openDialog}
          className="h-auto w-full gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-brand-primary-hover sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          {actionLabel}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add offline appointment</DialogTitle>
            <DialogDescription>
              Create an appointment for a customer booked outside the website.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <form className="space-y-4" onSubmit={saveAppointment} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="offline-service">Service</Label>
                <select
                  id="offline-service"
                  value={form.serviceId}
                  onChange={(event) => updateForm("serviceId", event.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-brand-surface px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  disabled={activeServices.length === 0}
                >
                  {activeServices.length === 0 ? (
                    <option value="">Add an active service first</option>
                  ) : null}
                  {activeServices.map((service) => (
                    <option key={service.databaseId} value={service.databaseId}>
                      {service.name} - {service.duration} - {service.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-customer-name">Customer Name</Label>
                <Input
                  id="offline-customer-name"
                  value={form.customerName}
                  onChange={(event) => updateForm("customerName", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-phone">Phone</Label>
                <Input
                  id="offline-phone"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={15}
                  value={form.customerPhone}
                  onChange={(event) => updateForm("customerPhone", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-email">Email</Label>
                <Input
                  id="offline-email"
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => updateForm("customerEmail", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-date">Date</Label>
                <Input
                  id="offline-date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.bookingDate}
                  onChange={(event) => updateForm("bookingDate", event.target.value)}
                  onInput={(event) =>
                    updateForm("bookingDate", event.currentTarget.value)
                  }
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="offline-time">Time</Label>
                <div
                  id="offline-time"
                  className="space-y-3 rounded-lg border border-border/70 bg-brand-surface p-3"
                >
                  {slotGroups.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <div className="text-xs font-medium uppercase text-muted-foreground">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {group.slots.map((time) => {
                          const isUnavailable = unavailableTimes.has(time)
                          const isSelected = form.bookingTime === time
                          return (
                            <Button
                              key={time}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              disabled={!form.bookingDate || isUnavailable}
                              className="h-9 justify-center rounded-md text-xs"
                              onClick={() => updateForm("bookingTime", time)}
                            >
                              {time}
                              {isUnavailable ? " · Booked" : ""}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-vehicle-year">Vehicle Year</Label>
                <Input
                  id="offline-vehicle-year"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={form.vehicleYear}
                  onChange={(event) => updateForm("vehicleYear", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-vehicle-make">Vehicle Make</Label>
                <Input
                  id="offline-vehicle-make"
                  value={form.vehicleMake}
                  onChange={(event) => updateForm("vehicleMake", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-vehicle-model">Vehicle Model</Label>
                <Input
                  id="offline-vehicle-model"
                  value={form.vehicleModel}
                  onChange={(event) => updateForm("vehicleModel", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offline-vin">VIN</Label>
                <Input
                  id="offline-vin"
                  maxLength={17}
                  value={form.vehicleVin}
                  onChange={(event) => updateForm("vehicleVin", event.target.value)}
                  className="h-11 border-border bg-brand-surface"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="offline-notes">Notes</Label>
                <textarea
                  id="offline-notes"
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  maxLength={500}
                  rows={4}
                  className="min-h-28 w-full resize-y rounded-lg border border-border bg-brand-surface px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <p className="text-xs text-brand-muted">
                  {form.notes.length}/500 characters
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || activeServices.length === 0}
              >
                {isSubmitting ? "Adding..." : "Add appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
