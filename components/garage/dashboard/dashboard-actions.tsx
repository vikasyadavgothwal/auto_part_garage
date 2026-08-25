import Link from "next/link"
import { Calendar, Wrench } from "lucide-react"

import { appRoutes } from "@/lib/routes"

export function DashboardActions({
  canViewSchedule = true,
  canViewServices = true,
}: {
  canViewSchedule?: boolean
  canViewServices?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {canViewSchedule ? <Link
        href={appRoutes.schedule}
        className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/10 p-6 transition-all hover:bg-primary/20"
      >
        <div className="rounded-lg bg-primary p-3">
          <Calendar className="h-6 w-6 text-primary-foreground" />
        </div>

        <div>
          <div className="text-lg font-bold text-foreground">
            View Schedule
          </div>
          <div className="text-sm text-brand-muted">Manage your calendar</div>
        </div>
      </Link> : null}

      {canViewServices ? <Link
        href={appRoutes.services}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary"
      >
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
          <Wrench className="h-6 w-6 text-primary" />
        </div>

        <div>
          <div className="text-lg font-bold text-foreground">
            Manage Services
          </div>
          <div className="text-sm text-brand-muted">
            Update your service catalog
          </div>
        </div>
      </Link> : null}
    </div>
  )
}
