import Link from "next/link"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  actionLabel: string
  href: string
  className?: string
}

export function SectionHeader({
  title,
  actionLabel,
  href,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        className
      )}
    >
      <h2 className="text-xl font-bold text-foreground">{title}</h2>

      <Link
        href={href}
        className="text-sm font-medium text-primary transition-colors hover:text-brand-primary-hover"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
