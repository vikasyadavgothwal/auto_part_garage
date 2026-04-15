"use client"

import {
  Bell,
  ChevronDown,
  Search,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-brand-panel backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <SidebarTrigger className="text-brand-muted hover:bg-transparent hover:text-foreground lg:hidden" />

        <div className="max-w-xl flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <Input
              type="text"
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-border bg-brand-surface pl-10 pr-4 text-foreground placeholder:text-brand-muted focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative text-brand-muted hover:bg-transparent hover:text-foreground"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="flex items-center gap-2 rounded-lg bg-brand-panel-strong px-3 py-2 hover:bg-brand-panel-strong"
          >
            <User className="h-5 w-5 text-brand-muted" />
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              ABC Logistics
            </span>
            <ChevronDown className="h-4 w-4 text-brand-muted" />
          </Button>
        </div>
      </div>
    </header>
  )
}
