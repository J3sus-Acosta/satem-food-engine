import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, PublicOrderStatusResult } from '@/types'
import { handleRouteError } from '@/lib/api'

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<PublicOrderStatusResult[]>>> {
  try {
    const body = await req.json()
    const { locationId, orderNumber, phone } = body

    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json({ error: 'El campo "locationId" es obligatorio.' }, { status: 400 })
    }

    const cleanOrderNumber = typeof orderNumber === 'string' ? orderNumber.trim() : undefined
    const cleanPhone = typeof phone === 'string' ? phone.trim() : undefined

    if (!cleanOrderNumber && !cleanPhone) {
      return NextResponse.json(
        { error: 'Debe ingresar un número de pedido o número de teléfono.' },
        { status: 400 }
      )
    }

    const results = await orderService.lookupPublicOrderStatus(locationId, {
      orderNumber: cleanOrderNumber,
      phone: cleanPhone,
    })

    return NextResponse.json({ data: results }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al consultar el estado del pedido.',
      'POST /api/orders/status-lookup'
    )
  }
}
