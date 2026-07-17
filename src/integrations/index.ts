/**
 * Integrations module entry point.
 * Exports all third-party API adapters (n8n, Google, SumUp, Telegram, WhatsApp).
 */

export { N8nIntegration } from './n8n'
export { GoogleIntegration } from './google'
export { SumUpIntegration } from './sumup'
export { TelegramIntegration } from './telegram'
export { WhatsAppIntegration } from './whatsapp'
export type { N8nTriggerPayload } from './n8n'
export type { GeocodingResult } from './google'
export type { SumUpCheckoutResponse } from './sumup'
export type { TelegramMessagePayload } from './telegram'
export type { WhatsAppMessagePayload } from './whatsapp'
