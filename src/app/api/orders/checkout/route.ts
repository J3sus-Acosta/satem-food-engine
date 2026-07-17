import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, OrderWithItems } from '@/types'
import { handleRouteError } from '@/lib/api'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const body = await req.json()
    const { locationId, customerName, customerPhone, items } = body

    // 1. Basic request body validation
    if (!locationId) {
      return NextResponse.json({ error: 'El campo "locationId" es obligatorio.' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe contener al menos un ítem.' },
        { status: 400 }
      )
    }

    // 2. Invoke OrderService domain orchestrator
    const order = await orderService.createCustomerOrder(locationId, {
      customerName,
      customerPhone,
      items,
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error interno al procesar el checkout del cliente.',
      'POST /api/orders/checkout'
    )
  }
}
