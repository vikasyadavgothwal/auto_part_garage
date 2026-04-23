import { Badge } from "@/components/ui/badge"
import type { DashboardStatusVariant } from "@/lib/garage-page-data"

const statusBadgeClasses: Record<DashboardStatusVariant, string> = {
  warning:
    "border-brand-warning/20 bg-brand-warning/10 text-brand-warning hover:bg-brand-warning/10",
  info: "border-brand-info/20 bg-brand-info/10 text-brand-info hover:bg-brand-info/10",
}

type StatusBadgeProps = {
  label: string
  variant: DashboardStatusVariant
}

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return <Badge className={statusBadgeClasses[variant]}>{label}</Badge>
}
