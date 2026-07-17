import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

import { handleRouteError } from '@/lib/api'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id, itemId } = await context.params
    const order = await orderService.removeItem(id, itemId)
    return NextResponse.json({ data: order })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al remover el ítem del pedido',
      'DELETE /api/orders/[id]/items/[itemId]'
    )
  }
}
