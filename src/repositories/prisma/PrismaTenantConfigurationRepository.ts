import 'server-only'

import { db } from '@/server/db'
import type { ITenantConfigurationRepository } from '../interfaces/ITenantConfigurationRepository'
import type { PaymentConfiguration, PaymentProvider } from '@/types'

/**
 * Prisma implementation of ITenantConfigurationRepository.
 *
 * Resolves the effective PaymentConfiguration for a Location by applying
 * the full priority hierarchy. This is the ONLY place in the codebase
 * that knows about this resolution logic and has access to Prisma.
 *
 * Priority hierarchy (first non-null wins):
 *   1. Location.paymentProvider / Location.paymentConfiguration
 *   2. Organization.paymentProvider / Organization.paymentConfiguration
 *   3. process.env.PAYMENT_PROVIDER (env fallback, no configuration)
 *   4. 'SUMUP' (hardcoded final fallback, no configuration)
 *
 * paymentConfiguration is NEVER merged between levels.
 * The first configuration found in the hierarchy is used as-is.
 */
export class PrismaTenantConfigurationRepository implements ITenantConfigurationRepository {
  /**
   * Resolves the effective PaymentConfiguration for the given location.
   * Returns a fully-resolved, non-null PaymentConfiguration.
   */
  async resolvePaymentConfig(locationId: string): Promise<PaymentConfiguration> {
    // Fetch Location with its Organization in a single query
    const location = await db.location.findUnique({
      where: { id: locationId },
      select: {
        paymentProvider: true,
        paymentConfiguration: true,
        organization: {
          select: {
            paymentProvider: true,
            paymentConfiguration: true,
          },
        },
      },
    })

    // Level 1: Location
    if (location?.paymentProvider != null) {
      return {
        provider: location.paymentProvider as PaymentProvider,
        configuration: parseConfiguration(location.paymentConfiguration),
      }
    }

    // Level 2: Organization
    if (location?.organization.paymentProvider != null) {
      return {
        provider: location.organization.paymentProvider as PaymentProvider,
        configuration: parseConfiguration(location.organization.paymentConfiguration),
      }
    }

    // Level 3: Environment variable
    const envProvider = process.env.PAYMENT_PROVIDER?.toUpperCase().trim()
    if (envProvider) {
      return {
        provider: envProvider as PaymentProvider,
        configuration: {},
      }
    }

    // Level 4: Hardcoded fallback
    return {
      provider: 'SUMUP',
      configuration: {},
    }
  }
}

/**
 * Parses a Prisma Json field into Record<string, string>.
 * Returns {} for null, undefined, or non-object values.
 * Never throws — safe to call with any Prisma Json output.
 */
function parseConfiguration(raw: unknown): Record<string, string> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}
