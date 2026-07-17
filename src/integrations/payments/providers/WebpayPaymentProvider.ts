import type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from '../interfaces/IPaymentProvider'

/**
 * Webpay (Transbank) implementation of IPaymentProvider.
 *
 * Scaffolding with fully functional mock mode for local testing and multi-tenant setup.
 *
 * @see IPaymentProvider — implemented contract.
 * @see PaymentProviderFactory — activates this provider.
 */
export class WebpayPaymentProvider implements IPaymentProvider {
  private readonly config: Record<string, unknown>
  private readonly commerceCode: string

  constructor(config?: Record<string, unknown>) {
    this.config = config || {}
    this.commerceCode =
      (this.config.commerceCode as string) ||
      process.env.WEBPAY_COMMERCE_CODE ||
      'mock_webpay_commerce_5678'
  }

  /**
   * Creates a mock Webpay Plus transaction for testing/development.
   */
  async createIntent(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<CreatePaymentIntentResult> {
    const providerTransactionId = `webpay_tx_${Math.random().toString(36).substring(2, 11)}`
    const checkoutUrl = `https://mock.webpay.cl/pay/${providerTransactionId}?paymentId=${paymentId}&amount=${amount}&currency=${currency}`
    const expiresAt = new Date(Date.now() + 1800 * 1000) // 30 mins

    return {
      providerTransactionId,
      checkoutUrl,
      expiresAt,
      rawPayload: {
        token: providerTransactionId,
        payment_id: paymentId,
        commerce_code: this.commerceCode,
        amount,
        currency,
        status: 'INITIALIZED',
        created_at: new Date().toISOString(),
      },
    }
  }

  /**
   * Verifies an incoming mock Webpay webhook notification.
   */
  async verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    // Standardize headers
    const normalizedHeaders = Object.keys(headers).reduce(
      (acc, key) => {
        acc[key.toLowerCase()] = headers[key]
        return acc
      },
      {} as Record<string, string>
    )

    const isProd = process.env.NODE_ENV === 'production'
    const mockSig = normalizedHeaders['x-mock-signature']

    if (isProd) {
      // Production real Transbank validation would check tokens/commit here
      // For the MVP skeleton, fail in production if not implemented
      return {
        isValid: false,
        paymentId: '',
        providerTransactionId: '',
        amount: 0,
        status: 'FAILED',
      }
    }

    if (mockSig === 'true' || !process.env.WEBPAY_API_KEY) {
      try {
        const payload = JSON.parse(rawBody) as Record<string, unknown>
        return {
          isValid: true,
          paymentId: String(payload.paymentId ?? 'unknown_payment'),
          providerTransactionId: String(payload.providerTransactionId ?? 'unknown_tx'),
          amount: Number(payload.amount ?? 0),
          status: (payload.status as 'PAID' | 'FAILED' | 'REFUNDED') ?? 'PAID',
        }
      } catch {
        return {
          isValid: false,
          paymentId: '',
          providerTransactionId: '',
          amount: 0,
          status: 'FAILED',
        }
      }
    }

    return {
      isValid: false,
      paymentId: '',
      providerTransactionId: '',
      amount: 0,
      status: 'FAILED',
    }
  }

  /**
   * Queries Webpay mock transaction status.
   */
  async fetchStatus(providerTransactionId: string): Promise<'PAID' | 'FAILED' | 'PENDING'> {
    if (providerTransactionId.startsWith('webpay_tx_')) {
      return 'PAID'
    }
    return 'PENDING'
  }

  /**
   * Initiates a mock refund via Webpay.
   */
  async refund(providerTransactionId: string, amount: number): Promise<boolean> {
    console.log(
      `[WebpayPaymentProvider] Mock Webpay Refund — tx: ${providerTransactionId}, amount: ${amount}, commerce: ${this.commerceCode}`
    )
    return true
  }
}
