import { type NextRequest, NextResponse } from 'next/server'
import { kitchenService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<never>>> {
  return NextResponse.json(
    {
      error:
        'Este endpoint está obsoleto. Por favor, use PATCH /api/kitchen/orders/[id]/status con body { "status": "READY" }.',
    },
    { status: 410 }
  )
}
