/**
 * Integrations module entry point.
 * Exports all third-party API adapters (n8n, Google, SumUp, Telegram, WhatsApp).
 */

export { N8nIntegration } from './n8n'
export { GoogleIntegration } from './google'
export { SumUpPaymentProvider } from './sumup/SumUpPaymentProvider'
export type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from './interfaces/IPaymentProvider'
export { TelegramIntegration } from './telegram'
export { WhatsAppIntegration } from './whatsapp'
export type { N8nTriggerPayload } from './n8n'
export type { GeocodingResult } from './google'
export type { TelegramMessagePayload } from './telegram'
export type { WhatsAppMessagePayload } from './whatsapp'
