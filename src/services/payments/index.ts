import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { IPaymentRepository } from '@/repositories'
import type { Payment, PaymentProvider, Money } from '@/types'

/**
 * Service handling payments and coordinating with third-party providers.
 *
 * Responsibilities:
 * - Payment registration and tracking.
 * - Calling external integrations (SumUp, Stripe, etc.) to initiate transactions.
 * - Processing webhooks from payment providers.
 */
export class PaymentService {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  /**
   * Initiates a payment process for an order.
   * Generates a pending transaction and coordinates with the provider integration.
   */
  async initiatePayment(
    orderId: string,
    provider: PaymentProvider,
    amount: Money,
    currency?: string
  ): Promise<Payment> {
    throw new NotImplementedError('PaymentService.initiatePayment')
  }

  /**
   * Processes a webhook callback from a payment provider.
   */
  async processProviderWebhook(provider: PaymentProvider, payload: unknown): Promise<Payment> {
    throw new NotImplementedError('PaymentService.processProviderWebhook')
  }

  /**
   * Refirms a payment transaction manually or via sync.
   */
  async syncPaymentStatus(paymentId: string): Promise<Payment> {
    throw new NotImplementedError('PaymentService.syncPaymentStatus')
  }

  /**
   * Initiates a refund for a payment.
   */
  async refundPayment(paymentId: string): Promise<Payment> {
    throw new NotImplementedError('PaymentService.refundPayment')
  }
}
