import { ServicesManager } from "@/components/garage/services/services-manager"
import { servicesPageData } from "@/lib/garage-page-data"
import { getGarageServices } from "@/lib/garage-services.server"

export default async function GarageServicesPage() {
  const services = await getGarageServices()

  return (
    <ServicesManager
      title={servicesPageData.title}
      description={servicesPageData.description}
      actionLabel={servicesPageData.primaryActionLabel}
      tips={servicesPageData.tips}
      initialServices={services}
    />
  )
}
