import DashboardOverviewPage from "./dashboard/page"

type GarageHomePageProps = {
  searchParams?: Promise<{ payment?: string; session_id?: string }>
}

export default function GarageHomePage({ searchParams }: GarageHomePageProps) {
  return <DashboardOverviewPage searchParams={searchParams} />
}
