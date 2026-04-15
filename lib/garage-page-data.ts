type DashboardStatIconKey = "calendar" | "clock" | "star" | "checkCircle2"
type DashboardStatusVariant = "warning" | "info"

type DashboardPageData = {
  title: string
  description: string
  stats: Array<{
    title: string
    value: string
    subtext: string
    iconKey: DashboardStatIconKey
  }>
  todaysSchedule: Array<{
    time: string
    bookingId: string
    customer: string
    vehicle: string
    service: string
    duration: string
    status: string
    statusVariant: DashboardStatusVariant
  }>
  upcomingBookings: Array<{
    date: string
    time: string
    bookingId: string
    customer: string
    vehicle: string
    service: string
  }>
  performance: Array<{
    title: string
    value: string
    subtext: string
    highlight: boolean
  }>
  reviews: Array<{
    name: string
    rating: number
    comment: string
    date: string
  }>
}

type ScheduleAppointment = {
  customer: string
  service: string
  duration: string
}

type SchedulePageData = {
  title: string
  description: string
  primaryActionLabel: string
  weekLabel: string
  weekStats: Array<{
    label: string
    value: string
  }>
  days: string[]
  timeSlots: string[]
  appointments: Record<string, Partial<Record<string, ScheduleAppointment>>>
  upcomingToday: Array<{
    time: string
    duration: string
    customer: string
    service: string
  }>
}

type BookingsPageData = {
  title: string
  description: string
  stats: Array<{
    title: string
    value: string
    valueClass: string
    iconKey?: "calendar"
    showIcon: boolean
  }>
  bookings: Array<{
    id: string
    date: string
    time: string
    customer: string
    vehicle: string
    service: string
    revenue: string
    status: string
    statusClass: string
  }>
  calendarView: {
    title: string
    description: string
  }
}

type ServicesPageData = {
  title: string
  description: string
  primaryActionLabel: string
  stats: Array<{
    title: string
    value: string
    valueClass: string
  }>
  services: Array<{
    id: string
    name: string
    category: string
    duration: string
    price: string
    bookings: string
    status: string
    statusClass: string
  }>
  tips: string[]
}

type ReviewsStatIconKey = "star" | "messageSquare" | "thumbsUp"

type ReviewsPageData = {
  title: string
  description: string
  stats: Array<{
    title: string
    value: string
    iconKey?: ReviewsStatIconKey
    iconClass?: string
    valueClass?: string
  }>
  ratingDistribution: Array<{
    stars: number
    count: number
    percentage: number
  }>
  reviews: Array<{
    id: string
    date: string
    customer: string
    service: string
    rating: number
    comment: string
    helpful: number
    status: string
    statusClass: string
    actionLabel: string
  }>
  reputationTips: string[]
}

export const dashboardPageData: DashboardPageData = {
  title: "Dashboard",
  description: "Manage your bookings and track daily operations.",
  stats: [
    {
      title: "Today's Bookings",
      value: "8",
      subtext: "3 completed",
      iconKey: "calendar",
    },
    {
      title: "Upcoming Bookings",
      value: "24",
      subtext: "Next 7 days",
      iconKey: "clock",
    },
    {
      title: "Customer Rating",
      value: "4.8",
      subtext: "Based on 127 reviews",
      iconKey: "star",
    },
    {
      title: "Completion Rate",
      value: "96%",
      subtext: "Last 30 days",
      iconKey: "checkCircle2",
    },
  ],
  todaysSchedule: [
    {
      time: "09:00 AM",
      bookingId: "BK-101",
      customer: "John Doe",
      vehicle: "2019 Toyota Camry",
      service: "Oil Change",
      duration: "30 min",
      status: "In Progress",
      statusVariant: "warning",
    },
    {
      time: "10:30 AM",
      bookingId: "BK-102",
      customer: "Jane Smith",
      vehicle: "2020 Honda Accord",
      service: "Brake Inspection",
      duration: "45 min",
      status: "Scheduled",
      statusVariant: "info",
    },
    {
      time: "02:00 PM",
      bookingId: "BK-103",
      customer: "Mike Johnson",
      vehicle: "2021 Ford F-150",
      service: "Tire Rotation",
      duration: "30 min",
      status: "Scheduled",
      statusVariant: "info",
    },
  ],
  upcomingBookings: [
    {
      date: "Tomorrow",
      time: "09:00 AM",
      bookingId: "BK-104",
      customer: "Sarah Williams",
      vehicle: "2018 Chevrolet Malibu",
      service: "Full Service",
    },
    {
      date: "Jan 25",
      time: "11:00 AM",
      bookingId: "BK-105",
      customer: "Tom Brown",
      vehicle: "2019 Nissan Altima",
      service: "AC Repair",
    },
  ],
  performance: [
    {
      title: "Total Bookings",
      value: "156",
      subtext: "↑ 12% vs last month",
      highlight: true,
    },
    {
      title: "Revenue",
      value: "$12,450",
      subtext: "↑ 18% vs last month",
      highlight: true,
    },
    {
      title: "Avg Service Time",
      value: "42 min",
      subtext: "Within target",
      highlight: false,
    },
    {
      title: "Repeat Customers",
      value: "64%",
      subtext: "↑ 5% vs last month",
      highlight: true,
    },
  ],
  reviews: [
    {
      name: "John Doe",
      rating: 5,
      comment: "Excellent service! Very professional and quick.",
      date: "Yesterday",
    },
    {
      name: "Jane Smith",
      rating: 5,
      comment: "Great experience, highly recommended!",
      date: "2 days ago",
    },
  ],
}

export const schedulePageData: SchedulePageData = {
  title: "Schedule",
  description: "Manage your appointment calendar.",
  primaryActionLabel: "Add Appointment",
  weekLabel: "Week of January 22 - 28, 2024",
  weekStats: [
    { label: "This Week", value: "6 bookings" },
    { label: "Today", value: "2 bookings" },
    { label: "Available Slots", value: "64" },
  ],
  days: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  timeSlots: [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ],
  appointments: {
    "9:00 AM": {
      Tuesday: {
        customer: "Mike Johnson",
        service: "Tire Rotation",
        duration: "45 min",
      },
    },
    "10:00 AM": {
      Monday: {
        customer: "John Doe",
        service: "Oil Change",
        duration: "30 min",
      },
      Thursday: {
        customer: "Tom Anderson",
        service: "Oil Change",
        duration: "30 min",
      },
    },
    "11:00 AM": {
      Wednesday: {
        customer: "Sarah Williams",
        service: "AC Service",
        duration: "60 min",
      },
    },
    "2:00 PM": {
      Monday: {
        customer: "Jane Smith",
        service: "Brake Service",
        duration: "90 min",
      },
    },
    "3:00 PM": {
      Friday: {
        customer: "Lisa Brown",
        service: "Inspection",
        duration: "45 min",
      },
    },
  },
  upcomingToday: [
    {
      time: "10:00 AM",
      duration: "30 min",
      customer: "John Doe",
      service: "Oil Change",
    },
    {
      time: "2:00 PM",
      duration: "90 min",
      customer: "Jane Smith",
      service: "Brake Service",
    },
  ],
}

export const bookingsPageData: BookingsPageData = {
  title: "Bookings",
  description: "Manage your customer appointments and schedule.",
  stats: [
    {
      title: "Today",
      value: "2",
      valueClass: "text-foreground",
      iconKey: "calendar",
      showIcon: true,
    },
    {
      title: "This Week",
      value: "4",
      valueClass: "text-foreground",
      showIcon: false,
    },
    {
      title: "Pending",
      value: "1",
      valueClass: "text-brand-warning",
      showIcon: false,
    },
    {
      title: "Expected Revenue",
      value: "$285",
      valueClass: "text-primary",
      showIcon: false,
    },
  ],
  bookings: [
    {
      id: "BK-301",
      date: "Today",
      time: "10:00 AM",
      customer: "John Doe",
      vehicle: "2019 Toyota Camry",
      service: "Oil Change",
      revenue: "$45.00",
      status: "Confirmed",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "BK-302",
      date: "Today",
      time: "2:00 PM",
      customer: "Jane Smith",
      vehicle: "2021 Honda Accord",
      service: "Brake Service",
      revenue: "$120.00",
      status: "Confirmed",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "BK-303",
      date: "Tomorrow",
      time: "9:00 AM",
      customer: "Mike Johnson",
      vehicle: "2020 Ford F-150",
      service: "Tire Rotation",
      revenue: "$35.00",
      status: "Confirmed",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "BK-304",
      date: "Jan 26",
      time: "11:00 AM",
      customer: "Sarah Williams",
      vehicle: "2018 Chevrolet Silverado",
      service: "AC Service",
      revenue: "$85.00",
      status: "Pending",
      statusClass:
        "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10",
    },
  ],
  calendarView: {
    title: "Calendar View",
    description: "Full calendar view with drag-and-drop scheduling coming soon.",
  },
}

export const servicesPageData: ServicesPageData = {
  title: "Services",
  description: "Manage your service offerings and pricing.",
  primaryActionLabel: "Add Service",
  stats: [
    {
      title: "Total Services",
      value: "4",
      valueClass: "text-foreground",
    },
    {
      title: "Active",
      value: "3",
      valueClass: "text-primary",
    },
    {
      title: "Total Bookings",
      value: "86",
      valueClass: "text-foreground",
    },
    {
      title: "Avg. Price",
      value: "$71.25",
      valueClass: "text-foreground",
    },
  ],
  services: [
    {
      id: "SRV-001",
      name: "Oil Change",
      category: "Maintenance",
      duration: "30 min",
      price: "$45.00",
      bookings: "24 total",
      status: "Active",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "SRV-002",
      name: "Brake Service",
      category: "Repairs",
      duration: "90 min",
      price: "$120.00",
      bookings: "18 total",
      status: "Active",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "SRV-003",
      name: "Tire Rotation",
      category: "Maintenance",
      duration: "45 min",
      price: "$35.00",
      bookings: "32 total",
      status: "Active",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
    },
    {
      id: "SRV-004",
      name: "AC Service",
      category: "Repairs",
      duration: "60 min",
      price: "$85.00",
      bookings: "12 total",
      status: "Inactive",
      statusClass:
        "border-brand-muted/20 bg-brand-muted/10 text-brand-muted hover:bg-brand-muted/10",
    },
  ],
  tips: [
    "Keep service descriptions clear and detailed to set customer expectations",
    "Update pricing regularly to stay competitive in your area",
    "Set realistic duration estimates to avoid scheduling conflicts",
  ],
}

export const reviewsPageData: ReviewsPageData = {
  title: "Customer Reviews",
  description: "Monitor and respond to customer feedback.",
  stats: [
    {
      title: "Average Rating",
      value: "4.4 / 5.0",
      iconKey: "star",
      iconClass: "text-primary",
    },
    {
      title: "Total Reviews",
      value: "5",
      iconKey: "messageSquare",
      iconClass: "text-brand-info",
    },
    {
      title: "Pending Review",
      value: "1",
      valueClass: "text-brand-warning",
    },
    {
      title: "5-Star Reviews",
      value: "3",
      iconKey: "thumbsUp",
      iconClass: "text-brand-success",
    },
  ],
  ratingDistribution: [
    { stars: 5, count: 3, percentage: 60 },
    { stars: 4, count: 1, percentage: 20 },
    { stars: 3, count: 1, percentage: 20 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ],
  reviews: [
    {
      id: "REV-001",
      date: "2024-01-22",
      customer: "John Doe",
      service: "Oil Change",
      rating: 5,
      comment:
        "Excellent service! Fast and professional. Will definitely come back.",
      helpful: 12,
      status: "Published",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
      actionLabel: "Reply",
    },
    {
      id: "REV-002",
      date: "2024-01-20",
      customer: "Jane Smith",
      service: "Brake Service",
      rating: 5,
      comment:
        "Great experience. The team was very knowledgeable and the price was fair.",
      helpful: 8,
      status: "Published",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
      actionLabel: "Reply",
    },
    {
      id: "REV-003",
      date: "2024-01-18",
      customer: "Mike Johnson",
      service: "Tire Rotation",
      rating: 4,
      comment: "Good service overall. Wait time was a bit longer than expected.",
      helpful: 5,
      status: "Published",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
      actionLabel: "Reply",
    },
    {
      id: "REV-004",
      date: "2024-01-15",
      customer: "Sarah Williams",
      service: "AC Service",
      rating: 5,
      comment: "Fixed my AC issue quickly. Very satisfied with the work!",
      helpful: 15,
      status: "Published",
      statusClass:
        "border-brand-success/20 bg-brand-success/10 text-brand-success hover:bg-brand-success/10",
      actionLabel: "Reply",
    },
    {
      id: "REV-005",
      date: "2024-01-22",
      customer: "Tom Anderson",
      service: "Oil Change",
      rating: 3,
      comment: "Service was okay but felt a bit rushed.",
      helpful: 0,
      status: "Pending",
      statusClass:
        "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10",
      actionLabel: "Review",
    },
  ],
  reputationTips: [
    "Respond promptly to all reviews, especially negative ones, to show you care",
    "Thank customers for positive feedback and address concerns professionally",
    "Encourage satisfied customers to leave reviews after their service",
  ],
}
