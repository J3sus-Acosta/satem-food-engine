import { type NextRequest, NextResponse } from 'next/server'
import { PrismaPaymentRepository } from '@/repositories/prisma/PrismaPaymentRepository'
import { orderService } from '@/services'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse } from '@/types'

const paymentRepo = new PrismaPaymentRepository()

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ orderId: string; status: string }>>> {
  try {
    const body = await req.json()
    const { paymentId, action } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'El campo "paymentId" es obligatorio.' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'La acción debe ser "approve" o "reject".' },
        { status: 400 }
      )
    }

    const payment = await paymentRepo.findById(paymentId)
    if (!payment) {
      return NextResponse.json({ error: `Pago "${paymentId}" no encontrado.` }, { status: 404 })
    }

    if (action === 'approve') {
      const confirmResult = await paymentRepo.confirmIfPending(payment.id, {
        externalId: payment.externalId || `mock_tx_${Date.now()}`,
        paidAt: new Date(),
        metadata: { mode: 'mock_simulator', approvedAt: new Date().toISOString() },
      })

      // Update OrderStatus to CONFIRMED and send to kitchen
      await orderService.confirmOrder(payment.orderId)

      return NextResponse.json(
        {
          data: {
            orderId: payment.orderId,
            status: confirmResult.payment.status,
          },
        },
        { status: 200 }
      )
    } else {
      const failedPayment = await paymentRepo.markFailed(
        payment.id,
        'Pago rechazado manualmente en pasarela simulada (Mock Simulator)'
      )

      return NextResponse.json(
        {
          data: {
            orderId: payment.orderId,
            status: failedPayment.status,
          },
        },
        { status: 200 }
      )
    }
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al procesar la confirmación simulada de pago.',
      'POST /api/payments/mock-confirm'
    )
  }
}
