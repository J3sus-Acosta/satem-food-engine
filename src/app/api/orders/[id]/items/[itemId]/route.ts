import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id, itemId } = await context.params
    const order = await orderService.removeItem(id, itemId)
    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[DELETE /api/orders/[id]/items/[itemId]] Error removing item from order:', err)

    let status = 500
    if (err.name === 'NotFoundError') status = 404
    if (err.name === 'ValidationError') status = 400
    if (err.name === 'ConflictError') status = 409

    return NextResponse.json(
      { error: err.message || 'Error al remover el ítem del pedido' },
      { status }
    )
  }
}
