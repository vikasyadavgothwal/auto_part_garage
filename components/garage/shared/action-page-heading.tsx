import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type ActionPageHeadingProps = {
  title: string
  description: string
  actionLabel: string
  icon: LucideIcon
}

export function ActionPageHeading({
  title,
  description,
  actionLabel,
  icon: Icon,
}: ActionPageHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-brand-muted">{description}</p>
      </div>

      <Button className="h-auto w-full gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-brand-primary-hover sm:w-auto">
        <Icon className="h-5 w-5" />
        {actionLabel}
      </Button>
    </div>
  )
}
