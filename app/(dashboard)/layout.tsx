import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/app-header"
import { requireGarageUser } from "@/lib/auth/server"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireGarageUser()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh min-w-0 bg-brand-surface">
        <DashboardHeader user={user} />
        <div className="flex min-w-0 flex-1 flex-col p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
