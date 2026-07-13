"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationPopup } from "@/components/notification-popup"
import { logoutGarage } from "@/lib/auth/client"
import { getDashboardUserName, type DashboardUser } from "@/lib/auth/types"
import { appRoutes } from "@/lib/routes"

export function DashboardHeader({ user }: { user: DashboardUser }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = getDashboardUserName(user)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutGarage()
    router.replace(appRoutes.login)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-brand-panel backdrop-blur-sm">
      <div className="flex h-16 min-w-0 items-center justify-between gap-4 px-4 lg:px-8">
        <SidebarTrigger className="text-brand-muted hover:bg-transparent hover:text-foreground lg:hidden" />

        <div className="min-w-0 max-w-xl flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
            <Input
              type="text"
              placeholder="Search..."
              className="h-10 w-full rounded-sm border border-border bg-brand-surface pl-10 pr-4 text-foreground placeholder:text-brand-muted focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open notifications"
                className="relative text-brand-muted hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
              >
                <Bell className="h-6 w-6" />
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-brand-panel bg-primary"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-sm border border-border bg-brand-panel p-0 shadow-2xl shadow-black/40"
            >
              <NotificationPopup />
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 rounded-sm bg-brand-panel-strong px-3 py-2 hover:bg-brand-panel-strong"
              >
                <User className="h-5 w-5 text-brand-muted" />
                <span className="hidden max-w-44 truncate text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-brand-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="px-2 py-2">
                <span className="block truncate text-sm text-foreground">
                  {displayName}
                </span>
                <span className="block truncate font-normal">
                  {user.email ?? "Garage account"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onSelect={() => void handleLogout()}
                className="cursor-pointer px-2 py-2"
              >
                <LogOut />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
