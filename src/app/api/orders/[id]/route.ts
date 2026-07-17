import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id } = await context.params
    const order = await orderService.getOrder(id)
    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/orders/[id]] Error retrieving order:', err)

    let status = 500
    if (err.name === 'NotFoundError') status = 404

    return NextResponse.json({ error: err.message || 'Error al obtener el pedido' }, { status })
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
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[PATCH /api/orders/[id]] Error updating order:', err)

    let status = 500
    if (err.name === 'NotFoundError') status = 404
    if (err.name === 'ValidationError') status = 400
    if (err.name === 'ConflictError') status = 409

    return NextResponse.json({ error: err.message || 'Error al actualizar el pedido' }, { status })
  }
}
