import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse, PaymentIntentResult } from '@/types'

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
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/orders/[id]/payment] Payment intent creation failed:', err)

    const isValidationOrNotFound = err.name === 'ValidationError' || err.name === 'NotFoundError'
    const isConflict = err.name === 'ConflictError'

    let status = 500
    if (isValidationOrNotFound) status = 400
    if (isConflict) status = 409

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al iniciar el intento de pago' },
      { status }
    )
  }
}
