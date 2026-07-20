import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

import { handleRouteError } from '@/lib/api'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id: orderId } = await params
    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        {
          error: 'El campo "status" es requerido. Valores permitidos: PREPARING, READY, COMPLETED',
        },
        { status: 400 }
      )
    }

    let updatedOrder: OrderWithItems

    switch (status) {
      case 'CONFIRMED':
      case 'REOPEN':
        updatedOrder = await orderService.reopenOrder(
          orderId,
          status === 'CONFIRMED' ? 'CONFIRMED' : 'PREPARING'
        )
        break
      case 'PREPARING':
        try {
          updatedOrder = await orderService.startPreparing(orderId)
        } catch {
          // If order was already delivered/completed, allow reopen back to PREPARING
          updatedOrder = await orderService.reopenOrder(orderId, 'PREPARING')
        }
        break
      case 'READY':
        updatedOrder = await orderService.markReady(orderId)
        break
      case 'COMPLETED':
        updatedOrder = await orderService.markDelivered(orderId)
        break
      default:
        return NextResponse.json(
          {
            error: `Estado "${status}" inválido. Valores permitidos: REOPEN, CONFIRMED, PREPARING, READY, COMPLETED`,
          },
          { status: 400 }
        )
    }

    return NextResponse.json<ApiResponse<OrderWithItems>>({ data: updatedOrder }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al actualizar el estado del pedido',
      'PATCH /api/kitchen/orders/[id]/status'
    )
  }
}
