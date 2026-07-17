import 'server-only'

import { ValidationError } from '@/lib/errors'
import type { IPaymentProvider } from './interfaces/IPaymentProvider'
import type { PaymentConfiguration, PaymentProvider } from '@/types'
import { SumUpPaymentProvider } from './providers/SumUpPaymentProvider'
import { WebpayPaymentProvider } from './providers/WebpayPaymentProvider'

/**
 * Builds IPaymentProvider instances from a resolved PaymentConfiguration.
 *
 * Responsibilities:
 * - ONLY construct the correct IPaymentProvider for a given provider key.
 * - Does NOT resolve tenant configuration.
 * - Does NOT query the database, environment variables, or any external source.
 * - Does NOT contain business logic or priority resolution.
 *
 * Priority resolution lives exclusively in ITenantConfigurationRepository.
 * The Factory only receives an already-resolved PaymentConfiguration.
 *
 * @see ITenantConfigurationRepository — resolves priority hierarchy.
 * @see PrismaTenantConfigurationRepository — concrete implementation.
 */
export class PaymentProviderFactory {
  /**
   * Builds an IPaymentProvider from an already-resolved PaymentConfiguration.
   *
   * This method does NOT query anything — it simply maps the provider key
   * to the corresponding implementation.
   *
   * @param config - The resolved PaymentConfiguration (from ITenantConfigurationRepository).
   * @throws {ValidationError} if the provider key has no registered implementation.
   *
   * @example
   * ```ts
   * const config = await tenantConfigRepo.resolvePaymentConfig(locationId)
   * const provider = PaymentProviderFactory.build(config)
   * const intent = await provider.createIntent(...)
   * ```
   */
  static build(config: PaymentConfiguration): IPaymentProvider {
    return PaymentProviderFactory.buildFromKey(config.provider)
  }

  /**
   * Compatibility method for singleton instantiation at startup.
   * Reads process.env.PAYMENT_PROVIDER → falls back to 'SUMUP'.
   *
   * Used only in the PaymentService singleton block (src/services/payments/index.ts).
   * For per-request provider resolution, use build() with a resolved PaymentConfiguration.
   */
  static resolve(): IPaymentProvider {
    const raw = (process.env.PAYMENT_PROVIDER ?? 'SUMUP').toUpperCase().trim()
    return PaymentProviderFactory.buildFromKey(raw as PaymentProvider)
  }

  /**
   * Internal: maps a provider key to its implementation.
   * @throws {ValidationError} for unknown provider keys.
   */
  private static buildFromKey(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case 'SUMUP':
        return new SumUpPaymentProvider()
      case 'WEBPAY':
        return new WebpayPaymentProvider()
      default:
        throw new ValidationError(
          `Payment provider "${provider}" has no registered implementation. ` +
            `Supported providers: SUMUP, WEBPAY.`
        )
    }
  }
}
