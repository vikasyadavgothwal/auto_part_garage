import { forwardBackendRequest } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return forwardBackendRequest(request, "/api/v1/business/plan")
}
