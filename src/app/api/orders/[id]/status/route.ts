import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderStatus } from '@/types'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

interface OrderStatusResult {
  status: OrderStatus
  orderNumber: string
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<OrderStatusResult>>> {
  try {
    const { id: orderId } = await params

    const order = await orderService.getOrder(orderId)

    return NextResponse.json<ApiResponse<OrderStatusResult>>(
      {
        data: {
          status: order.status,
          orderNumber: order.orderNumber,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/orders/[id]/status] Error retrieving status:', err)

    let status = 500
    if (err.name === 'NotFoundError') status = 404

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al obtener el estado del pedido' },
      { status }
    )
  }
}
