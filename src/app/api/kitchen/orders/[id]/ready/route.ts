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
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id } = await params
    const updatedOrder = await kitchenService.markReady(id)
    return NextResponse.json<ApiResponse<OrderWithItems>>({ data: updatedOrder }, { status: 200 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[PATCH /api/kitchen/orders/[id]/ready] Error:', err)

    const isConflictOrValidation =
      err.name === 'ConflictError' || err.name === 'ValidationError' || err.name === 'NotFoundError'

    const status = isConflictOrValidation ? 400 : 500

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al marcar pedido como listo' },
      { status }
    )
  }
}
