/**
 * Contract for payment providers (SumUp, Webpay, Stripe, etc.)
 * following the Dependency Inversion Principle.
 *
 * All external payment integrations MUST implement this interface.
 * PaymentService depends exclusively on this abstraction — never on
 * a concrete provider.
 *
 * @see PaymentProviderFactory — resolves the active implementation at runtime.
 */

export interface CreatePaymentIntentResult {
  /** Provider-assigned transaction identifier */
  providerTransactionId: string
  /** URL to redirect the customer to complete payment */
  checkoutUrl: string
  /** Optional expiration timestamp for the checkout session */
  expiresAt?: Date
  /** Full raw response from the provider for audit/debugging */
  rawPayload: Record<string, unknown>
}

export interface WebhookVerificationResult {
  /** Whether the webhook signature is valid */
  isValid: boolean
  /** Internal SATEM payment ID (may be embedded in the webhook payload) */
  paymentId: string
  /** Provider-assigned transaction identifier */
  providerTransactionId: string
  /** Transaction amount confirmed by the provider */
  amount: number
  /** Final transaction status reported by the provider */
  status: 'PAID' | 'FAILED' | 'REFUNDED'
}

export interface IPaymentProvider {
  /**
   * Initiates a payment checkout session with the external gateway.
   * Returns the provider transaction ID and a redirect URL for the customer.
   */
  createIntent(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<CreatePaymentIntentResult>

  /**
   * Verifies the authenticity and signature of an incoming webhook notification.
   * Must be idempotent — called once per webhook delivery attempt.
   */
  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookVerificationResult>

  /**
   * Actively queries the gateway for the current transaction status.
   * Used as a fallback when webhooks are delayed or missed.
   */
  fetchStatus(providerTransactionId: string): Promise<'PAID' | 'FAILED' | 'PENDING'>

  /**
   * Initiates a refund for a previously captured payment.
   * Returns true if the refund was accepted by the provider.
   */
  refund(providerTransactionId: string, amount: number): Promise<boolean>
}
