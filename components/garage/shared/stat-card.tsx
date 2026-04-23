import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SummaryStatCardProps = {
  title: string
  value: string
  valueClass?: string
  icon?: LucideIcon
  iconClass?: string
}

export function SummaryStatCard({
  title,
  value,
  valueClass,
  icon: Icon,
  iconClass,
}: SummaryStatCardProps) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        {Icon ? (
          <div className="mb-2 flex items-center gap-3">
            <Icon className={cn("h-5 w-5", iconClass)} />
            <div className="text-sm text-brand-muted">{title}</div>
          </div>
        ) : (
          <div className="mb-2 text-sm text-brand-muted">{title}</div>
        )}

        <div
          className={cn(
            "text-3xl font-bold",
            valueClass ?? "text-foreground"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
