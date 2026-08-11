import { forwardBackendRequest } from "@/lib/auth/backend"

type RouteContext = { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic"

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params
  return forwardBackendRequest(request, `/api/v1/business/api-keys/${encodeURIComponent(id)}`)
}
