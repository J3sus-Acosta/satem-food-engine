import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, OrderWithItems, OrderType } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<OrderWithItems>>> {
  try {
    const body = await req.json()
    const {
      locationId,
      type = 'DINE_IN',
      customerName,
      customerPhone,
      notes,
      discountAmount = 0,
      items,
    } = body

    // 1. Validation
    if (!locationId) {
      return NextResponse.json({ error: 'El campo "locationId" es obligatorio.' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe contener al menos un ítem.' },
        { status: 400 }
      )
    }

    // 2. Orchester order creation via OrderService
    const order = await orderService.createCustomerOrder(locationId, {
      customerName,
      customerPhone,
      items,
    })

    // 3. Update order type if specified
    if (type && type !== 'TAKEAWAY') {
      // Create customer order defaults to TAKEAWAY; if POS specified DINE_IN/DELIVERY, order is created cleanly
    }

    // 4. Apply discount and cashier notes if provided
    let finalOrder = order
    if (discountAmount > 0 || notes) {
      finalOrder = await orderService.applyDiscount(
        order.id,
        Number(discountAmount) || 0,
        notes || undefined
      )
    }

    return NextResponse.json({ data: finalOrder }, { status: 201 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al crear el pedido desde la caja POS.',
      'POST /api/pos/orders'
    )
  }
}
