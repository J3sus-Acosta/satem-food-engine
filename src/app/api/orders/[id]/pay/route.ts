import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse, InitiatePaymentResult } from '@/types'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<InitiatePaymentResult>>> {
  try {
    const { id: orderId } = await params
    const body = await req.json()
    const { provider, amount, currency } = body

    if (!provider) {
      return NextResponse.json({ error: 'provider es obligatorio' }, { status: 400 })
    }
    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'amount es obligatorio' }, { status: 400 })
    }

    const result = await paymentService.initiatePayment(orderId, provider, Number(amount), currency)
    return NextResponse.json<ApiResponse<InitiatePaymentResult>>({ data: result }, { status: 200 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/orders/[id]/pay] Error:', err)

    const isValidationOrNotFound = err.name === 'ValidationError' || err.name === 'NotFoundError'

    const status = isValidationOrNotFound ? 400 : 500

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al iniciar el pago' },
      { status }
    )
  }
}
