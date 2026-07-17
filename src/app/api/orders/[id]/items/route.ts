import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { menuItemId, productVariantId, quantity, notes, modifiers } = body

    if (!menuItemId) {
      return NextResponse.json({ error: 'menuItemId es requerido' }, { status: 400 })
    }
    if (!productVariantId) {
      return NextResponse.json({ error: 'productVariantId es requerido' }, { status: 400 })
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'quantity debe ser un entero positivo' }, { status: 400 })
    }

    const order = await orderService.addItem(id, {
      menuItemId,
      productVariantId,
      quantity,
      notes,
      modifiers,
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/orders/[id]/items] Error adding item to order:', err)

    let status = 500
    if (err.name === 'NotFoundError') status = 404
    if (err.name === 'ValidationError') status = 400
    if (err.name === 'ConflictError') status = 409

    return NextResponse.json(
      { error: err.message || 'Error al agregar el ítem al pedido' },
      { status }
    )
  }
}
