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
 * - Inject location-specific configurations JSON to the provider instances.
 * - Does NOT resolve tenant configuration hierarchy.
 * - Does NOT query the database or any external source.
 * - Does NOT contain business logic or priority resolution.
 *
 * Priority resolution lives exclusively in ITenantConfigurationRepository.
 */
export class PaymentProviderFactory {
  /**
   * Builds an IPaymentProvider from an already-resolved PaymentConfiguration.
   */
  static build(config: PaymentConfiguration): IPaymentProvider {
    return PaymentProviderFactory.buildFromKey(config.provider, config.configuration)
  }

  /**
   * Compatibility method for singleton instantiation at startup.
   * Reads process.env.PAYMENT_PROVIDER → falls back to 'SUMUP'.
   */
  static resolve(): IPaymentProvider {
    const raw = (process.env.PAYMENT_PROVIDER ?? 'SUMUP').toUpperCase().trim()
    return PaymentProviderFactory.buildFromKey(raw as PaymentProvider)
  }

  /**
   * Internal: maps a provider key to its implementation.
   * @throws {ValidationError} for unknown provider keys.
   */
  private static buildFromKey(
    provider: PaymentProvider,
    configuration?: Record<string, unknown>
  ): IPaymentProvider {
    switch (provider) {
      case 'SUMUP':
        return new SumUpPaymentProvider(configuration)
      case 'WEBPAY':
        return new WebpayPaymentProvider(configuration)
      default:
        throw new ValidationError(
          `Payment provider "${provider}" has no registered implementation. ` +
            `Supported providers: SUMUP, WEBPAY.`
        )
    }
  }
}
