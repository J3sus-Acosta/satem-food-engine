/**
 * Integrations module entry point.
 * Exports all third-party API adapters (Google, SumUp, Telegram, WhatsApp)
 * and the payment provider infrastructure (factory + interface).
 */

// ─── Payment infrastructure ────────────────────────────────────────────────────
export { PaymentProviderFactory } from './payments/PaymentProviderFactory'
export type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from './payments/interfaces/IPaymentProvider'

// ─── Legacy shims (kept for backwards compatibility) ───────────────────────────
// These re-export from the canonical payments/ location.
export { SumUpPaymentProvider } from './sumup/SumUpPaymentProvider'

// ─── Other integrations ────────────────────────────────────────────────────────
export { GoogleIntegration } from './google'
export { TelegramIntegration } from './telegram'
export { WhatsAppIntegration } from './whatsapp'
export type { GeocodingResult } from './google'
export type { TelegramMessagePayload } from './telegram'
export type { WhatsAppMessagePayload } from './whatsapp'
