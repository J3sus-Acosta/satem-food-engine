import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse, PaymentIntentResult } from '@/types'

import { handleRouteError } from '@/lib/api'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<PaymentIntentResult>>> {
  try {
    const { id: orderId } = await params

    // Process payment intent creation via PaymentService
    const result = await paymentService.createPaymentIntent(orderId)

    return NextResponse.json<ApiResponse<PaymentIntentResult>>({ data: result }, { status: 201 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al iniciar el intento de pago',
      'POST /api/orders/[id]/payment'
    )
  }
}
