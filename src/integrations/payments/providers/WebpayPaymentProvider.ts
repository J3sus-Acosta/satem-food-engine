import { NotImplementedError } from '@/lib/errors'
import type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from '../interfaces/IPaymentProvider'

/**
 * Webpay (Transbank) skeleton implementation of IPaymentProvider.
 *
 * STATUS: NOT IMPLEMENTED — Scaffolding only.
 *
 * All methods throw NotImplementedError until the Transbank SDK integration
 * is completed. Activate this provider via:
 *
 *   PAYMENT_PROVIDER=webpay
 *
 * Implementation checklist (when ready):
 * - [ ] Install @transbank/transbank-sdk
 * - [ ] Implement createIntent() using WebpayPlus.Transaction.create()
 * - [ ] Implement verifyWebhook() using TBK-Token header + commit flow
 * - [ ] Implement fetchStatus() using WebpayPlus.Transaction.status()
 * - [ ] Implement refund() using WebpayPlus.Transaction.refund()
 * - [ ] Map Transbank status codes to IPaymentProvider status types
 * - [ ] Add WEBPAY_COMMERCE_CODE and WEBPAY_API_KEY to .env
 *
 * @see IPaymentProvider — implemented contract.
 * @see PaymentProviderFactory — activates this provider via PAYMENT_PROVIDER=webpay.
 * @see docs/payment-providers.md — integration guide.
 */
export class WebpayPaymentProvider implements IPaymentProvider {
  /**
   * Creates a Webpay Plus transaction.
   * @throws {NotImplementedError} — Transbank integration not yet implemented.
   */
  async createIntent(
    _paymentId: string,
    _amount: number,
    _currency: string
  ): Promise<CreatePaymentIntentResult> {
    throw new NotImplementedError('WebpayPaymentProvider.createIntent')
  }

  /**
   * Verifies an incoming Webpay webhook / return notification.
   * @throws {NotImplementedError} — Transbank integration not yet implemented.
   */
  async verifyWebhook(
    _headers: Record<string, string>,
    _rawBody: string
  ): Promise<WebhookVerificationResult> {
    throw new NotImplementedError('WebpayPaymentProvider.verifyWebhook')
  }

  /**
   * Queries Webpay for the current transaction status.
   * @throws {NotImplementedError} — Transbank integration not yet implemented.
   */
  async fetchStatus(_providerTransactionId: string): Promise<'PAID' | 'FAILED' | 'PENDING'> {
    throw new NotImplementedError('WebpayPaymentProvider.fetchStatus')
  }

  /**
   * Initiates a refund via Webpay Plus.
   * @throws {NotImplementedError} — Transbank integration not yet implemented.
   */
  async refund(_providerTransactionId: string, _amount: number): Promise<boolean> {
    throw new NotImplementedError('WebpayPaymentProvider.refund')
  }
}
