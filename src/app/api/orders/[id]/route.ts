import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

import { handleRouteError } from '@/lib/api'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id } = await context.params
    const order = await orderService.getOrder(id)
    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al obtener el pedido', 'GET /api/orders/[id]')
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { action, reason } = body

    if (!action) {
      return NextResponse.json({ error: 'El campo "action" es requerido' }, { status: 400 })
    }

    let order: OrderWithItems

    switch (action) {
      case 'confirm':
        order = await orderService.confirmOrder(id)
        break
      case 'ready':
        order = await orderService.markReady(id)
        break
      case 'deliver':
        order = await orderService.markDelivered(id)
        break
      case 'cancel':
        order = await orderService.cancelOrder(id, reason || 'Cancelación de usuario')
        break
      default:
        return NextResponse.json(
          {
            error: `Acción "${action}" no permitida. Valores válidos: confirm, ready, deliver, cancel`,
          },
          { status: 400 }
        )
    }

    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al actualizar el pedido', 'PATCH /api/orders/[id]')
  }
}
