import { Plus } from "lucide-react"

import { ServiceManagementTipsCard } from "@/components/garage/services/service-management-tips-card"
import { ServiceStats } from "@/components/garage/services/service-stats"
import { ServicesTable } from "@/components/garage/services/services-table"
import { ActionPageHeading } from "@/components/garage/shared/action-page-heading"
import { servicesPageData } from "@/lib/garage-page-data"

export default function GarageServicesPage() {
  return (
    <div className="space-y-8">
      <ActionPageHeading
        title={servicesPageData.title}
        description={servicesPageData.description}
        actionLabel={servicesPageData.primaryActionLabel}
        icon={Plus}
      />

      <ServiceStats stats={servicesPageData.stats} />
      <ServicesTable services={servicesPageData.services} />
      <ServiceManagementTipsCard tips={servicesPageData.tips} />
    </div>
  )
}
