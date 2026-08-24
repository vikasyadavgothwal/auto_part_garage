"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute left-3 top-3 size-7",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute right-3 top-3 size-7",
        ),
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_middle: "bg-primary/15 text-foreground",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-muted text-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className: buttonClassName, ...buttonProps }) => (
          <button className={buttonClassName} {...buttonProps}>
            <ChevronLeft className="size-4" />
          </button>
        ),
        NextMonthButton: ({ className: buttonClassName, ...buttonProps }) => (
          <button className={buttonClassName} {...buttonProps}>
            <ChevronRight className="size-4" />
          </button>
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
