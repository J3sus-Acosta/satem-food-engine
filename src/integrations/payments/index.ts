/**
 * payments/ sub-module public API.
 *
 * Exports the factory and the provider interface.
 * Concrete providers are internal — resolved only through PaymentProviderFactory.
 */

export { PaymentProviderFactory } from './PaymentProviderFactory'
export type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from './interfaces/IPaymentProvider'
