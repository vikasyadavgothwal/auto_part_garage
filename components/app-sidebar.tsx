"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  House,
  Calendar,
  ShoppingBag,
  Wrench,
  Star,
  Settings,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { appRoutes, stripBasePath } from "@/lib/routes"

const items = [
  { title: "Overview", url: appRoutes.overview, icon: House },
  { title: "Schedule", url: appRoutes.schedule, icon: Calendar },
  { title: "Bookings", url: appRoutes.bookings, icon: ShoppingBag },
  { title: "Services", url: appRoutes.services, icon: Wrench },
  { title: "Reviews", url: appRoutes.reviews, icon: Star },
]

export function AppSidebar() {
  const currentPath = stripBasePath(usePathname())

  return (
    <Sidebar className="border-sidebar-border bg-brand-panel text-foreground">
      <SidebarHeader className="border-b border-border px-6 py-6">
        <Link href={appRoutes.overview} className="block">
          <h2 className="text-xl font-bold">AutoPartsPro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Garage
          </p>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto px-4 py-4">
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon

            const isActive =
              currentPath === item.url ||
              currentPath.startsWith(`${item.url}/`)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`h-auto rounded-sm px-4 py-3 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={
                currentPath === appRoutes.settings ||
                currentPath.startsWith(`${appRoutes.settings}/`)
              }
              className={`h-auto rounded-sm px-4 py-3 transition-all ${
                currentPath === appRoutes.settings ||
                currentPath.startsWith(`${appRoutes.settings}/`)
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Link
                href={appRoutes.settings}
                className="flex items-center gap-3"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}