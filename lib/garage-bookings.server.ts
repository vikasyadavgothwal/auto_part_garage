import { cookies } from "next/headers"

import { requestBackend } from "@/lib/auth/backend"
import {
  bookingsPageData,
  schedulePageData,
  type BookingsPageData,
  type SchedulePageData,
} from "@/lib/garage-page-data"
import { tablePageSize, type PaginationMeta } from "@/lib/pagination"
import type { GarageProfileRecord } from "@/lib/garage-settings"

export type GarageBookingRecord = {
  id: string
  publicId: string
  garageId: string
  customerId: string | null
  serviceId: string | null
  serviceName: string
  customerName: string
  customerEmail: string | null
  customerPhone: string
  vehicleYear: string | null
  vehicleMake: string | null
  vehicleModel: string | null
  vehicleVin: string | null
  notes: string | null
  bookingDate: string | null
  bookingTime: string | null
  durationMinutes: number
  price: number
  currency: string
  status: "pending" | "pending_slot_selection" | "confirmed" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

type GarageBookingsPayload = {
  ok: boolean
  bookings?: GarageBookingRecord[]
  pagination?: PaginationMeta
  message?: string
}

const statusClass = (status: GarageBookingRecord["status"]) => {
  if (status === "pending") {
    return "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10"
  }
  if (status === "cancelled") {
    return "border-primary/20 bg-primary/10 text-primary hover:bg-primary/10"
  }
  if (status === "pending_slot_selection") {
    return "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10"
  }
  return "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10"
}

const titleCase = (value: string) =>
  value === "pending_slot_selection"
    ? "Awaiting Slot Selection"
    : value.slice(0, 1).toUpperCase() + value.slice(1)

const asDate = (value: string) => new Date(`${value}T12:00:00`)

const formatDate = (value: string | null) =>
  value
    ? asDate(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled"

const formatVehicle = (booking: GarageBookingRecord) =>
  [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel]
    .filter(Boolean)
    .join(" ") || "Vehicle not added"

const formatMoney = (amount: number, currency: string) =>
  `${currency} ${(amount / 100).toFixed(2)}`

const todayKey = () => new Date().toISOString().slice(0, 10)

const weekRange = (weekOffset = 0) => {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7) + weekOffset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

const inWeek = (booking: GarageBookingRecord, weekOffset = 0) => {
  if (!booking.bookingDate) return false
  const date = asDate(booking.bookingDate)
  const { monday, sunday } = weekRange(weekOffset)
  return date >= monday && date <= sunday
}

const inCurrentWeek = (booking: GarageBookingRecord) => inWeek(booking)

const dayName = (date: string) =>
  asDate(date).toLocaleDateString("en-US", { weekday: "long" })

const normalizeDayAvailability = (profile?: GarageProfileRecord) => {
  const defaultAvailability = Object.fromEntries(
    schedulePageData.days.map((day) => [day, true]),
  ) as Record<string, boolean>

  if (!profile) {
    return defaultAvailability
  }

  const hasHoursByDay = Object.keys(profile.workingHoursByDay ?? {}).length > 0
  const selectedDays = hasHoursByDay
    ? Object.entries(profile.workingHoursByDay)
        .filter(([, hours]) => hours?.enabled)
        .map(([day]) => day)
    : profile.workingDays

  const availability = Object.fromEntries(
    schedulePageData.days.map((day) => [day, false]),
  ) as Record<string, boolean>

  if (selectedDays.length === 0) {
    for (const day of schedulePageData.days) {
      availability[day] = true
    }

    return availability
  }

  for (const day of selectedDays) {
    availability[day] = true
  }

  return availability
}

const sortTimes = (times: string[]) =>
  [...times].sort((a, b) => {
    const parsedA = Date.parse(`2000-01-01 ${a}`)
    const parsedB = Date.parse(`2000-01-01 ${b}`)
    return parsedA - parsedB
  })

export async function getGarageBookings() {
  const response = await requestBackend("/api/v1/garage/bookings?all=1", {
    cookieHeader: (await cookies()).toString(),
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as GarageBookingsPayload
  return payload.bookings ?? []
}

export async function getGarageBookingsPage(page: number) {
  const response = await requestBackend(
    `/api/v1/garage/bookings?page=${page}&pageSize=${tablePageSize}`,
    {
      cookieHeader: (await cookies()).toString(),
    },
  )

  if (!response.ok) {
    return {
      bookings: [],
      pagination: { page, pageSize: tablePageSize, total: 0, totalPages: 1 },
    }
  }

  const payload = (await response.json()) as GarageBookingsPayload
  return {
    bookings: payload.bookings ?? [],
    pagination:
      payload.pagination ??
      { page, pageSize: tablePageSize, total: 0, totalPages: 1 },
  }
}

export function buildBookingsPageData(
  bookings: GarageBookingRecord[],
): BookingsPageData {
  const today = todayKey()
  const todayBookings = bookings.filter((booking) => booking.bookingDate === today)
  const weekBookings = bookings.filter(inCurrentWeek)
  const pending = bookings.filter(
    (booking) =>
      booking.status === "pending" || booking.status === "pending_slot_selection",
  )
  const revenue = bookings.reduce((total, booking) => total + booking.price, 0)

  return {
    ...bookingsPageData,
    stats: [
      {
        title: "Today",
        value: String(todayBookings.length),
        valueClass: "text-foreground",
        iconKey: "calendar",
        showIcon: true,
      },
      {
        title: "This Week",
        value: String(weekBookings.length),
        valueClass: "text-foreground",
        showIcon: false,
      },
      {
        title: "Pending",
        value: String(pending.length),
        valueClass: "text-brand-warning",
        showIcon: false,
      },
      {
        title: "Expected Revenue",
        value: formatMoney(revenue, "AED"),
        valueClass: "text-primary",
        showIcon: false,
      },
    ],
    bookings: bookings.map((booking) => ({
      id: booking.publicId,
      backendId: booking.id,
      customerId: booking.customerId,
      date: formatDate(booking.bookingDate),
      time: booking.bookingTime ?? "Awaiting user",
      customer: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      vehicle: formatVehicle(booking),
      vehicleVin: booking.vehicleVin,
      service: booking.serviceName,
      duration: `${booking.durationMinutes} min`,
      notes: booking.notes,
      revenue: formatMoney(booking.price, booking.currency),
      status: titleCase(booking.status),
      rawStatus: booking.status,
      statusClass: statusClass(booking.status),
    })),
  }
}

export function buildSchedulePageData(
  bookings: GarageBookingRecord[],
  weekOffset = 0,
  profile?: GarageProfileRecord,
): SchedulePageData {
  const dayAvailability = normalizeDayAvailability(profile)
  const scheduledBookings = bookings.filter(
    (booking) => booking.bookingDate && booking.bookingTime,
  )
  const weekBookings = scheduledBookings.filter((booking) => inWeek(booking, weekOffset))
  const todayBookings = bookings.filter(
    (booking) => booking.bookingDate === todayKey(),
  )
  const appointmentTimes = weekBookings
    .map((booking) => booking.bookingTime)
    .filter((time): time is string => Boolean(time))
  const timeSlots = sortTimes(
    Array.from(new Set([...schedulePageData.timeSlots, ...appointmentTimes])),
  )
  const appointments: SchedulePageData["appointments"] = {}

  for (const booking of weekBookings) {
    if (!booking.bookingDate || !booking.bookingTime) continue
    const day = dayName(booking.bookingDate)
    appointments[booking.bookingTime] = {
      ...(appointments[booking.bookingTime] ?? {}),
      [day]: {
        customer: booking.customerName,
        service: booking.serviceName,
        duration: `${booking.durationMinutes} min`,
      },
    }
  }

  const activeWeekBookings = weekBookings.filter((booking) => {
    if (!booking.bookingDate) return false
    return dayAvailability[dayName(booking.bookingDate)]
  })

  const { monday, sunday } = weekRange(weekOffset)

  return {
    ...schedulePageData,
    dayAvailability,
    weekLabel: `Week of ${monday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })} - ${sunday.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
    weekStats: [
      {
        label: weekOffset === 0 ? "This Week" : "Selected Week",
        value: `${weekBookings.length} bookings`,
      },
      { label: "Today", value: `${todayBookings.length} bookings` },
      {
        label: "Available Slots",
        value: String(
          Math.max(
            0,
            timeSlots.length *
              Math.max(
              1,
              schedulePageData.days.filter((day) => dayAvailability[day]).length,
            ) -
              activeWeekBookings.length,
          ),
        ),
      },
    ],
    timeSlots,
    appointments,
    upcomingToday: todayBookings.filter((booking) => booking.bookingTime).map((booking) => ({
      time: booking.bookingTime ?? "",
      duration: `${booking.durationMinutes} min`,
      customer: booking.customerName,
      service: booking.serviceName,
    })),
  }
}
