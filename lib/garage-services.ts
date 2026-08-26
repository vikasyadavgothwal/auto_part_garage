export type GarageServiceStatus = "active" | "inactive" | "plan_suspended"

export type GarageServiceRecord = {
  id: string
  publicId: string
  garageId: string
  name: string
  category: string
  durationMinutes: number
  price: number
  currency: string
  bookingsCount: number
  ratingAverage?: number
  reviewCount?: number
  reviews?: GarageServiceReview[]
  status: GarageServiceStatus
  planSuspendedAt?: string | null
  planSuspensionReason?: string | null
  createdAt: string
  updatedAt: string
}

export type GarageServiceReview = {
  id: string
  customerName: string
  rating: number
  comment: string
  garageReply: string | null
  createdAt: string
  updatedAt: string
}

export type GarageServiceFormValues = {
  name: string
  category: string
  durationMinutes: number
  price: number | ""
  status: GarageServiceStatus
}

export type GarageServiceTableItem = {
  databaseId: string
  id: string
  name: string
  category: string
  duration: string
  durationMinutes: number
  price: string
  priceValue: number
  bookings: string
  bookingsCount: number
  ratingAverage: number
  reviewCount: number
  reviews: GarageServiceReview[]
  status: string
  statusValue: GarageServiceStatus
  statusClass: string
  planSuspendedAt?: string | null
  planSuspensionReason?: string | null
  isPlanSuspended: boolean
}

export const formatMoney = (cents: number, currency = "AED") =>
  `${currency} ${(cents / 100).toFixed(2)}`

export const formatGarageService = (
  service: GarageServiceRecord,
): GarageServiceTableItem => ({
  databaseId: service.id,
  id: service.publicId,
  name: service.name,
  category: service.category,
  duration: `${service.durationMinutes} min`,
  durationMinutes: service.durationMinutes,
  price: formatMoney(service.price, service.currency),
  priceValue: service.price / 100,
  bookings: `${service.bookingsCount} total`,
  bookingsCount: service.bookingsCount,
  ratingAverage: service.ratingAverage ?? 0,
  reviewCount: service.reviewCount ?? 0,
  reviews: service.reviews ?? [],
  status: service.status === "plan_suspended" ? "Suspended by plan" : service.status === "active" ? "Active" : "Inactive",
  statusValue: service.status,
  planSuspendedAt: service.planSuspendedAt ?? null,
  planSuspensionReason: service.planSuspensionReason ?? null,
  isPlanSuspended: service.status === "plan_suspended",
  statusClass:
    service.status === "active"
      ? "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10"
      : service.status === "plan_suspended"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10"
      : "border-brand-muted/20 bg-brand-muted/10 text-brand-muted hover:bg-brand-muted/10",
})

export const buildServiceStats = (services: GarageServiceTableItem[]) => {
  const activeServices = services.filter((service) => service.statusValue === "active")
  const totalBookings = services.reduce(
    (total, service) => total + service.bookingsCount,
    0,
  )
  const averagePrice =
    services.length === 0
      ? 0
      : services.reduce((total, service) => total + service.priceValue, 0) /
        services.length

  return [
    {
      title: "Total Services",
      value: String(services.length),
      valueClass: "text-foreground",
    },
    {
      title: "Active",
      value: String(activeServices.length),
      valueClass: "text-primary",
    },
    {
      title: "Total Bookings",
      value: String(totalBookings),
      valueClass: "text-foreground",
    },
    {
      title: "Avg. Price",
      value: formatMoney(Math.round(averagePrice * 100)),
      valueClass: "text-foreground",
    },
  ]
}
