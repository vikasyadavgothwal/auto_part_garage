import { Plus } from "lucide-react"

import { ScheduleCalendarTable } from "@/components/garage/schedule/schedule-calendar-table"
import { ScheduleLegendCard } from "@/components/garage/schedule/schedule-legend-card"
import { ScheduleOverviewCard } from "@/components/garage/schedule/schedule-overview-card"
import { ScheduleSettingsCard } from "@/components/garage/schedule/schedule-settings-card"
import { UpcomingTodayCard } from "@/components/garage/schedule/upcoming-today-card"
import { ActionPageHeading } from "@/components/garage/shared/action-page-heading"
import { schedulePageData } from "@/lib/garage-page-data"

export default function GarageSchedulePage() {
  return (
    <div className="space-y-8">
      <ActionPageHeading
        title={schedulePageData.title}
        description={schedulePageData.description}
        actionLabel={schedulePageData.primaryActionLabel}
        icon={Plus}
      />

      <ScheduleOverviewCard
        weekLabel={schedulePageData.weekLabel}
        weekStats={schedulePageData.weekStats}
      />
      <ScheduleCalendarTable
        days={schedulePageData.days}
        timeSlots={schedulePageData.timeSlots}
        appointments={schedulePageData.appointments}
      />
      <ScheduleLegendCard />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ScheduleSettingsCard />
        <UpcomingTodayCard appointments={schedulePageData.upcomingToday} />
      </div>
    </div>
  )
}
