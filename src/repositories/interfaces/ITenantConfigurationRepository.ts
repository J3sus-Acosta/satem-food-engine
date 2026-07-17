import type { PaymentConfiguration } from '@/types'

/**
 * Contrato de lectura de configuración efectiva del tenant.
 *
 * Responsabilidad única: resolver la PaymentConfiguration efectiva
 * para una sucursal, aplicando la jerarquía de prioridad completa.
 *
 * Jerarquía de resolución:
 *   1. Location.paymentProvider / Location.paymentConfiguration
 *   2. Organization.paymentProvider / Organization.paymentConfiguration
 *   3. process.env.PAYMENT_PROVIDER (sin paymentConfiguration)
 *   4. 'SUMUP' como fallback final (sin paymentConfiguration)
 *
 * REGLAS:
 * - paymentConfiguration NUNCA se fusiona entre niveles.
 *   Se usa la primera configuración encontrada en la jerarquía.
 * - El resultado siempre retorna un objeto válido (nunca null).
 * - El dominio (PaymentService) solo conoce esta interfaz — nunca Prisma.
 */
export interface ITenantConfigurationRepository {
  /**
   * Retorna la PaymentConfiguration efectiva para una sucursal.
   *
   * @param locationId - ID interno de la sucursal (Location.id)
   * @returns PaymentConfiguration con proveedor y configuración efectivos.
   *   configuration siempre es {} si no hay config en ningún nivel.
   */
  resolvePaymentConfig(locationId: string): Promise<PaymentConfiguration>
}
