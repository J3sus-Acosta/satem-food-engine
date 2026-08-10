import { type NextRequest, NextResponse } from 'next/server'
import { orderVoidService } from '@/services'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, VoidOrderResult } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<VoidOrderResult>>> {
  try {
    const body = await req.json()
    const {
      orderId,
      locationId,
      cashierUserId,
      adminUsernameOrEmail,
      adminPasswordInput,
      reason,
      itemsToReturn,
      isFullVoid,
    } = body

    if (!orderId || !locationId || !cashierUserId) {
      return NextResponse.json(
        { error: 'Los datos del pedido, sucursal y cajero son requeridos.' },
        { status: 400 }
      )
    }

    const result = await orderVoidService.executeVoid({
      orderId,
      locationId,
      cashierUserId,
      adminUsernameOrEmail,
      adminPasswordInput,
      reason,
      itemsToReturn: itemsToReturn || [],
      isFullVoid,
    })

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al procesar la anulación de venta',
      'POST /api/pos/orders/void/execute'
    )
  }
}
