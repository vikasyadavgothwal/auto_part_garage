import { forwardBackendRequest } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return forwardBackendRequest(request, "/api/v1/user/public-asset")
}
