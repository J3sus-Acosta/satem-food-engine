import 'server-only'

import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors'
import type { IPaymentRepository, IOrderRepository } from '@/repositories'
import type { IPaymentProvider } from '@/integrations'
import type { OrderService } from '../orders'
import type { Payment, PaymentProvider, Money, InitiatePaymentResult } from '@/types'

/**
 * Service handling payments and coordinating with third-party providers.
 *
 * Responsibilities:
 * - Payment registration and tracking.
 * - Calling external integrations (SumUp, Stripe, etc.) to initiate transactions.
 * - Processing webhooks from payment providers.
 * - Ensuring webhook idempotency and isolation of domain events.
 */
export class PaymentService {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly paymentProvider: IPaymentProvider,
    private readonly orderRepo: IOrderRepository,
    private readonly orderService: OrderService
  ) {}

  /**
   * Initiates a payment process for an order.
   * Generates a pending transaction and coordinates with the provider integration.
   */
  async initiatePayment(
    orderId: string,
    provider: PaymentProvider,
    amount: Money,
    currency?: string
  ): Promise<InitiatePaymentResult> {
    // 1. Retrieve the order
    const order = await this.orderRepo.findById(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // 2. Validate order status: Must be DRAFT
    if (order.status !== 'DRAFT') {
      throw new ValidationError(
        `Cannot pay for an order in status "${order.status}". Must be DRAFT.`
      )
    }

    // 3. Security check: Amount must match order's total amount
    if (Number(order.totalAmount) !== Number(amount)) {
      throw new ValidationError(
        `Payment amount mismatch. Order total is ${order.totalAmount}, but payment request was for ${amount}.`
      )
    }

    // 4. Manage active payment record (reuse or create)
    let payment = await this.paymentRepo.findByOrderId(orderId)
    if (payment) {
      if (payment.status === 'PAID') {
        throw new ConflictError(`Order "${orderId}" has already been paid successfully.`)
      }
      // Reset status to PENDING for the retry attempt
      payment = await this.paymentRepo.updateStatus(payment.id, 'PENDING')
    } else {
      // Create a brand new pending payment
      payment = await this.paymentRepo.create({
        orderId,
        provider,
        amount,
        currency: currency || 'CLP',
      })
    }

    // 5. Call external payment provider to create checkout session
    const intent = await this.paymentProvider.createIntent(payment.id, amount, currency || 'CLP')

    // 6. Update payment with provider's transaction ID
    payment = await this.paymentRepo.updateExternalId(
      payment.id,
      intent.providerTransactionId,
      intent.rawPayload
    )

    // 7. Return enriched response
    return {
      payment,
      orderNumber: order.orderNumber,
      checkoutUrl: intent.checkoutUrl,
      expiresAt: intent.expiresAt,
      estimatedPreparationTime: 15, // Hardcoded standard/buffer value for prep time
    }
  }

  /**
   * Processes a webhook callback from a payment provider.
   */
  async processProviderWebhook(
    provider: PaymentProvider,
    headers: Record<string, string>,
    rawBody: string
  ): Promise<Payment> {
    // 1. Validate signature via provider
    const verified = await this.paymentProvider.verifyWebhook(headers, rawBody)
    if (!verified.isValid) {
      throw new ValidationError('Invalid webhook signature')
    }

    // 2. Retrieve payment record (match by external provider transaction ID, fallback to database ID)
    let payment = await this.paymentRepo.findByExternalId(provider, verified.providerTransactionId)
    if (!payment) {
      payment = await this.paymentRepo.findById(verified.paymentId)
    }

    if (!payment) {
      throw new NotFoundError('Payment', verified.paymentId || verified.providerTransactionId)
    }

    // 3. Webhook Idempotency Check:
    // If payment is already in a final state, return immediately without re-firing events
    if (payment.status === 'PAID' || payment.status === 'FAILED' || payment.status === 'REFUNDED') {
      console.log(
        `[PaymentService.processProviderWebhook] Webhook transaction "${verified.providerTransactionId}" already processed (status: ${payment.status}). Ignoring.`
      )
      return payment
    }

    // 4. Handle state transition
    if (verified.status === 'PAID') {
      // Confirm payment in database
      payment = await this.paymentRepo.confirm(payment.id, {
        externalId: verified.providerTransactionId,
        paidAt: new Date(),
        metadata: { webhookProcessedAt: new Date().toISOString() },
      })

      // Update OrderStatus to CONFIRMED (which also triggers OrderPaidEvent conceptually)
      await this.orderService.confirmOrder(payment.orderId)
    } else if (verified.status === 'FAILED') {
      payment = await this.paymentRepo.markFailed(
        payment.id,
        'Transaction rejected by payment gateway webhook'
      )
      // Note: Order remains in DRAFT so the customer can edit/retry checkout.
    } else if (verified.status === 'REFUNDED') {
      payment = await this.paymentRepo.markRefunded(payment.id)

      // Cancel the order
      await this.orderService.cancelOrder(payment.orderId, 'Pago reembolsado por la pasarela')
    }

    return payment
  }

  /**
   * Refirms a payment transaction manually or via active sync.
   */
  async syncPaymentStatus(paymentId: string): Promise<Payment> {
    let payment = await this.paymentRepo.findById(paymentId)
    if (!payment) {
      throw new NotFoundError('Payment', paymentId)
    }

    if (payment.status === 'PAID' || !payment.externalId) {
      return payment
    }

    // Poll the provider for current status
    const status = await this.paymentProvider.fetchStatus(payment.externalId)
    if (status === 'PAID') {
      payment = await this.paymentRepo.confirm(payment.id, {
        externalId: payment.externalId,
        paidAt: new Date(),
        metadata: { syncProcessedAt: new Date().toISOString() },
      })
      await this.orderService.confirmOrder(payment.orderId)
    } else if (status === 'FAILED') {
      payment = await this.paymentRepo.markFailed(
        payment.id,
        'Transaction failed active status check'
      )
    }

    return payment
  }

  /**
   * Initiates a refund for a payment.
   */
  async refundPayment(paymentId: string): Promise<Payment> {
    let payment = await this.paymentRepo.findById(paymentId)
    if (!payment) {
      throw new NotFoundError('Payment', paymentId)
    }

    if (payment.status !== 'PAID') {
      throw new ValidationError(
        `Cannot refund payment in status "${payment.status}". Must be PAID.`
      )
    }

    if (!payment.externalId) {
      throw new ValidationError('Cannot refund payment without an external transaction ID.')
    }

    // Call provider refund API
    const success = await this.paymentProvider.refund(payment.externalId, payment.amount)
    if (!success) {
      throw new ValidationError('Refund request was rejected by the provider.')
    }

    payment = await this.paymentRepo.markRefunded(payment.id)
    await this.orderService.cancelOrder(payment.orderId, 'Pago reembolsado por administrador')

    return payment
  }
}

// Instantiate and export service singletons
import { PrismaPaymentRepository } from '@/repositories/prisma/PrismaPaymentRepository'
import { SumUpPaymentProvider } from '@/integrations/sumup/SumUpPaymentProvider'
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { orderService } from '../orders'

const paymentRepo = new PrismaPaymentRepository()
const paymentProvider = new SumUpPaymentProvider()
const orderRepo = new PrismaOrderRepository()

export const paymentService = new PaymentService(
  paymentRepo,
  paymentProvider,
  orderRepo,
  orderService
)
