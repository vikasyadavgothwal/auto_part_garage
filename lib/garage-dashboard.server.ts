import {
  getGarageBookings,
  type GarageBookingRecord,
} from "@/lib/garage-bookings.server"
import { dashboardPageData, type DashboardPageData } from "@/lib/garage-page-data"
import {
  getGarageReviews,
  type GarageServiceReviewRecord,
} from "@/lib/garage-reviews.server"

const asDate = (value: string) => new Date(`${value}T12:00:00`)

const todayKey = () => new Date().toISOString().slice(0, 10)

const formatVehicle = (booking: GarageBookingRecord) =>
  [booking.vehicleYear, booking.vehicleMake, booking.vehicleModel]
    .filter(Boolean)
    .join(" ") || "Vehicle not added"

const formatMoney = (amount: number, currency = "AED") =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100)

const formatDate = (value: string) =>
  asDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

const formatReviewDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const isCurrentMonth = (booking: GarageBookingRecord) => {
  const date = asDate(booking.bookingDate)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const isWithinLast30Days = (booking: GarageBookingRecord) => {
  const date = asDate(booking.bookingDate).getTime()
  const today = asDate(todayKey()).getTime()
  const thirtyDaysAgo = today - 29 * 24 * 60 * 60 * 1000
  return date >= thirtyDaysAgo && date <= today
}

const upcomingCutoffKey = () => {
  const cutoff = asDate(todayKey())
  cutoff.setDate(cutoff.getDate() + 7)
  return cutoff.toISOString().slice(0, 10)
}

const sortByAppointment = (a: GarageBookingRecord, b: GarageBookingRecord) =>
  `${a.bookingDate} ${a.bookingTime}`.localeCompare(
    `${b.bookingDate} ${b.bookingTime}`,
  )

const mapScheduleStatus = (
  status: GarageBookingRecord["status"],
): Pick<
  DashboardPageData["todaysSchedule"][number],
  "status" | "statusVariant"
> => {
  if (status === "pending") {
    return { status: "Pending", statusVariant: "warning" }
  }
  if (status === "completed") {
    return { status: "Completed", statusVariant: "info" }
  }
  return { status: "Scheduled", statusVariant: "info" }
}

function buildOverviewData(
  bookings: GarageBookingRecord[],
  reviews: GarageServiceReviewRecord[],
): DashboardPageData {
  const today = todayKey()
  const upcomingCutoff = upcomingCutoffKey()
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled")
  const todayBookings = activeBookings
    .filter((booking) => booking.bookingDate === today)
    .sort(sortByAppointment)
  const upcomingBookings = activeBookings
    .filter(
      (booking) =>
        booking.bookingDate > today && booking.bookingDate <= upcomingCutoff,
    )
    .sort(sortByAppointment)
  const completedToday = todayBookings.filter(
    (booking) => booking.status === "completed",
  ).length
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0
  const recentAppointments = bookings.filter(isWithinLast30Days)
  const completedRecent = recentAppointments.filter(
    (booking) => booking.status === "completed",
  ).length
  const completionRate = recentAppointments.length
    ? Math.round((completedRecent / recentAppointments.length) * 100)
    : 0
  const monthBookings = bookings.filter(isCurrentMonth)
  const completedMonthBookings = monthBookings.filter(
    (booking) => booking.status === "completed",
  )
  const monthRevenue = completedMonthBookings.reduce(
    (total, booking) => total + booking.price,
    0,
  )
  const averageDuration = completedMonthBookings.length
    ? Math.round(
        completedMonthBookings.reduce(
          (total, booking) => total + booking.durationMinutes,
          0,
        ) / completedMonthBookings.length,
      )
    : 0
  const customerCounts = new Map<string, number>()
  for (const booking of monthBookings.filter(
    (item) => item.status !== "cancelled",
  )) {
    const customerKey = booking.customerId ?? booking.customerName.trim().toLowerCase()
    customerCounts.set(customerKey, (customerCounts.get(customerKey) ?? 0) + 1)
  }
  const repeatCustomers = Array.from(customerCounts.values()).filter(
    (count) => count > 1,
  ).length
  const repeatCustomerRate = customerCounts.size
    ? Math.round((repeatCustomers / customerCounts.size) * 100)
    : 0

  return {
    ...dashboardPageData,
    stats: [
      {
        title: "Today's Bookings",
        value: String(todayBookings.length),
        subtext: `${completedToday} completed`,
        iconKey: "calendar",
      },
      {
        title: "Upcoming Bookings",
        value: String(upcomingBookings.length),
        subtext: "Next 7 days",
        iconKey: "clock",
      },
      {
        title: "Customer Rating",
        value: averageRating.toFixed(1),
        subtext: `Based on ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`,
        iconKey: "star",
      },
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        subtext: "Last 30 days",
        iconKey: "checkCircle2",
      },
    ],
    todaysSchedule: todayBookings.map((booking) => ({
      time: booking.bookingTime,
      bookingId: booking.publicId,
      customer: booking.customerName,
      vehicle: formatVehicle(booking),
      service: booking.serviceName,
      duration: `${booking.durationMinutes} min`,
      ...mapScheduleStatus(booking.status),
    })),
    upcomingBookings: upcomingBookings.slice(0, 5).map((booking) => ({
      date: formatDate(booking.bookingDate),
      time: booking.bookingTime,
      bookingId: booking.publicId,
      customer: booking.customerName,
      vehicle: formatVehicle(booking),
      service: booking.serviceName,
    })),
    performance: [
      {
        title: "Total Bookings",
        value: String(monthBookings.length),
        subtext: "This month",
        highlight: false,
      },
      {
        title: "Revenue",
        value: formatMoney(monthRevenue),
        subtext: "Completed bookings",
        highlight: true,
      },
      {
        title: "Avg Service Time",
        value: `${averageDuration} min`,
        subtext: "Completed this month",
        highlight: false,
      },
      {
        title: "Repeat Customers",
        value: `${repeatCustomerRate}%`,
        subtext: "This month",
        highlight: repeatCustomerRate > 0,
      },
    ],
    reviews: reviews.slice(0, 5).map((review) => ({
      name: review.customerName,
      rating: review.rating,
      comment: review.comment,
      date: formatReviewDate(review.createdAt),
    })),
  }
}

export async function getGarageDashboardData() {
  const [bookings, reviews] = await Promise.all([
    getGarageBookings(),
    getGarageReviews(),
  ])
  return buildOverviewData(bookings, reviews)
}
