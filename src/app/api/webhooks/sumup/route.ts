import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse, Payment } from '@/types'

import { handleRouteError } from '@/lib/api'

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
    return handleRouteError(error, 'Webhook processing failed', 'POST /api/webhooks/sumup')
  }
}
