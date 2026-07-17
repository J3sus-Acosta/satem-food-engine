import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse, Payment } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Payment>>> {
  try {
    // Read all headers
    const headersObj: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headersObj[key] = value
    })

    // Read raw body
    const rawBody = await req.text()

    // Process SumUp Webhook (Idempotent)
    const payment = await paymentService.processProviderWebhook('SUMUP', headersObj, rawBody)

    return NextResponse.json<ApiResponse<Payment>>({ data: payment }, { status: 200 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/webhooks/sumup] Webhook processing failed:', err)

    const isValidationOrNotFound = err.name === 'ValidationError' || err.name === 'NotFoundError'

    const status = isValidationOrNotFound ? 400 : 500

    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Webhook processing failed' },
      { status }
    )
  }
}
