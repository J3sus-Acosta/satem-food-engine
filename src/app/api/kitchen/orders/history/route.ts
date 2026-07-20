import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, Order } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Order[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationSlug = searchParams.get('locationId') || searchParams.get('location')

    const resolved = await TenantResolver.resolve(locationSlug)
    const historyOrders = await orderService.listOrders(resolved.locationId, {
      status: ['DELIVERED', 'CANCELLED'],
      limit: 25,
    })

    return NextResponse.json<ApiResponse<Order[]>>({ data: historyOrders }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al obtener el historial de comandas de cocina',
      'GET /api/kitchen/orders/history'
    )
  }
}
