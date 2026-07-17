import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors'
import type { ApiResponse, OrderWithItems } from '@/types'

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
    // 3. Staged domain error handling
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/orders/checkout] Checkout creation error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno al procesar el checkout del cliente.' },
      { status: 500 }
    )
  }
}
