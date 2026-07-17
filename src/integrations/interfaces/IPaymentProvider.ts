/**
 * Contract for payment providers (SumUp, Stripe, etc.) following Dependency Inversion.
 */

export interface CreatePaymentIntentResult {
  providerTransactionId: string
  checkoutUrl: string
  expiresAt?: Date
  rawPayload: Record<string, unknown>
}

export interface WebhookVerificationResult {
  isValid: boolean
  paymentId: string
  providerTransactionId: string
  amount: number
  status: 'PAID' | 'FAILED' | 'REFUNDED'
}

export interface IPaymentProvider {
  /**
   * Initiates a payment checkout session with the external gateway.
   */
  createIntent(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<CreatePaymentIntentResult>

  /**
   * Verifies the authenticity and signature of a webhook notification.
   */
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookVerificationResult>

  /**
   * Actively queries the gateway for the transaction status (Fallback/Sync).
   */
  fetchStatus(providerTransactionId: string): Promise<'PAID' | 'FAILED' | 'PENDING'>

  /**
   * Refunds a captured payment.
   */
  refund(providerTransactionId: string, amount: number): Promise<boolean>
}
