import { forwardBackendRequest } from "@/lib/auth/backend"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return forwardBackendRequest(request, "/api/v1/business/api-keys")
}

export async function POST(request: Request) {
  return forwardBackendRequest(request, "/api/v1/business/api-keys")
}
