import { ServicesManager } from "@/components/garage/services/services-manager"
import { AccessRestrictedCard } from "@/components/garage/shared/access-restricted-card"
import { getGarageBusinessAccess } from "@/lib/business-access.server"
import { servicesPageData } from "@/lib/garage-page-data"
import {
  getGarageServices,
  getGarageServicesPage,
} from "@/lib/garage-services.server"
import { pageFromSearchParams, type PageSearchParams } from "@/lib/pagination"

export default async function GarageServicesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const access = await getGarageBusinessAccess()
  if (!access.canView("services")) return <AccessRestrictedCard message="You do not have permission to view Garage services." />

  const page = pageFromSearchParams(await searchParams)
  const [services, tablePage] = await Promise.all([
    getGarageServices(),
    getGarageServicesPage(page),
  ])

  return (
    <ServicesManager
      key={`${tablePage.pagination.page}-${tablePage.pagination.total}`}
      title={servicesPageData.title}
      description={servicesPageData.description}
      actionLabel={servicesPageData.primaryActionLabel}
      tips={servicesPageData.tips}
      initialServices={tablePage.services}
      statServices={services}
      pagination={tablePage.pagination}
    />
  )
}
