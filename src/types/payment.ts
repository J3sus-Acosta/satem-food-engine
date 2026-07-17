import type { PaymentProvider } from './index'

export interface PaymentIntentResult {
  paymentId: string
  provider: PaymentProvider
  externalId: string | null
  checkoutUrl: string | null
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED'
}
