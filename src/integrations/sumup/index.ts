import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { Money } from '@/types'

export interface SumUpCheckoutResponse {
  id: string
  status: string
  checkoutUrl: string
  amount: number
  currency: string
}

/**
 * Integration service for SumUp payments.
 *
 * Responsibilities:
 * - Abstracting checkout creation, transaction queries, and refunds.
 * - Handling SumUp API signatures and authentication headers.
 */
export class SumUpIntegration {
  /**
   * Creates a SumUp Checkout session.
   * Returns a redirect URL for payment.
   */
  async createCheckout(
    amount: Money,
    currency: string,
    reference: string
  ): Promise<SumUpCheckoutResponse> {
    throw new NotImplementedError('SumUpIntegration.createCheckout')
  }

  /**
   * Retrieves a checkout status by its checkout ID.
   */
  async getCheckoutStatus(checkoutId: string): Promise<string> {
    throw new NotImplementedError('SumUpIntegration.getCheckoutStatus')
  }

  /**
   * Refunds a transaction via SumUp API.
   */
  async refundTransaction(transactionId: string, amount: Money): Promise<void> {
    throw new NotImplementedError('SumUpIntegration.refundTransaction')
  }
}
