import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import { PrismaPaymentRepository } from '@/repositories/prisma/PrismaPaymentRepository'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, PaymentProvider } from '@/types'

const paymentRepo = new PrismaPaymentRepository()

export async function POST(req: NextRequest): Promise<
  NextResponse<
    ApiResponse<{
      orderId: string
      orderNumber: string
      status: string
      totalAmount: number
      amountPaid: number
      change: number
      paymentMethod: string
    }>
  >
> {
  try {
    const body = await req.json()
    const { orderId, method, amountPaid, notes } = body

    if (!orderId) {
      return NextResponse.json({ error: 'El campo "orderId" es obligatorio.' }, { status: 400 })
    }

    if (!method) {
      return NextResponse.json({ error: 'El campo "method" es obligatorio.' }, { status: 400 })
    }

    let order = await orderService.getOrder(orderId)

    // Handle Staff Meal / Cortesía ($0 Total)
    if (method === 'STAFF_MEAL') {
      const staffNotes = notes || 'Comida de Empleado / Cortesía ($0)'
      order = await orderService.applyDiscount(orderId, order.subtotal, staffNotes)
    }

    const totalAmount = Number(order.totalAmount)
    const paid = amountPaid !== undefined && amountPaid !== null ? Number(amountPaid) : totalAmount
    const change = Math.max(0, paid - totalAmount)

    // Map method to PaymentProvider
    let provider: PaymentProvider = 'CASH'
    if (method === 'CARD_POS') provider = 'SUMUP'
    if (method === 'TRANSFER') provider = 'TRANSFER'
    if (method === 'STAFF_MEAL') provider = 'CASH'

    // Create completed payment record in repository
    let payment = await paymentRepo.findByOrderId(orderId)
    if (!payment) {
      payment = await paymentRepo.create({
        orderId,
        provider,
        amount: totalAmount,
        currency: 'CLP',
      })
    }

    await paymentRepo.confirmIfPending(payment.id, {
      externalId: `pos_${method.toLowerCase()}_${Date.now()}`,
      paidAt: new Date(),
      metadata: { method, amountPaid: paid, change, notes: notes || null },
    })

    // Transition Order status to CONFIRMED and dispatch ticket to Kitchen Dashboard
    const confirmedOrder = await orderService.confirmOrder(orderId)

    return NextResponse.json(
      {
        data: {
          orderId: confirmedOrder.id,
          orderNumber: confirmedOrder.orderNumber,
          status: confirmedOrder.status,
          totalAmount,
          amountPaid: paid,
          change,
          paymentMethod: method,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al procesar el cobro de la caja POS.',
      'POST /api/pos/pay'
    )
  }
}
