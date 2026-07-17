import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

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
      case 'PREPARING':
        updatedOrder = await orderService.startPreparation(orderId)
        break
      case 'READY':
        updatedOrder = await orderService.markReady(orderId)
        break
      case 'COMPLETED':
        updatedOrder = await orderService.completeOrder(orderId)
        break
      default:
        return NextResponse.json(
          { error: `Estado "${status}" inválido. Valores permitidos: PREPARING, READY, COMPLETED` },
          { status: 400 }
        )
    }

    return NextResponse.json<ApiResponse<OrderWithItems>>({ data: updatedOrder }, { status: 200 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[PATCH /api/kitchen/orders/[id]/status] KDS transition error:', err)

    const isValidationOrNotFound = err.name === 'ValidationError' || err.name === 'NotFoundError'
    const isConflict = err.name === 'ConflictError'

    let httpStatus = 500
    if (isValidationOrNotFound) httpStatus = 400
    if (isConflict) httpStatus = 409

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al actualizar el estado del pedido' },
      { status: httpStatus }
    )
  }
}
