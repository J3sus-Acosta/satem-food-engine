import 'server-only'

import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors'
import type {
  IPaymentRepository,
  IOrderRepository,
  ITenantConfigurationRepository,
} from '@/repositories'
import type { IPaymentProvider } from '@/integrations'
import type { OrderService } from '../orders'
import type {
  Payment,
  PaymentProvider,
  Money,
  InitiatePaymentResult,
  PaymentIntentResult,
} from '@/types'
import { PaymentProviderFactory } from '@/integrations/payments/PaymentProviderFactory'

/**
 * Service handling payments and coordinating with third-party providers.
 *
 * Responsibilities:
 * - Payment registration and tracking.
 * - Calling external integrations via IPaymentProvider (SumUp, Webpay, etc.).
 * - Processing webhooks from payment providers.
 * - Ensuring webhook idempotency and isolation of domain events.
 */
export class PaymentService {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    /** Fallback provider singleton — used for webhook/sync operations. */
    private readonly paymentProvider: IPaymentProvider,
    private readonly orderRepo: IOrderRepository,
    private readonly orderService: OrderService,
    /** Resolves the effective payment provider config per Location → Organization → .env → SUMUP. */
    private readonly tenantConfigRepo: ITenantConfigurationRepository
  ) {}

  /**
   * Creates a payment intent for an order.
   * Resolves multi-tenant provider configuration dynamically, initiates the external capture session,
   * records transaction details, and returns the redirect checkout URL.
   */
  async createPaymentIntent(orderId: string): Promise<PaymentIntentResult> {
    // 1. Retrieve the order
    const order = await this.orderRepo.findById(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // 2. Validate order status: Must be DRAFT or PENDING (for manual retry)
    if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot pay for an order in status "${order.status}". Must be DRAFT or PENDING.`
      )
    }

    // 3. Resolve active payment config (Location -> Organization -> .env -> SUMUP)
    const tenantConfig = await this.tenantConfigRepo.resolvePaymentConfig(order.locationId)

    // 4. Instantiate provider via factory using configuration JSON
    const providerInstance = PaymentProviderFactory.build(tenantConfig)

    // 5. Manage active payment record (reuse pending or create new one)
    let payment = await this.paymentRepo.findByOrderId(orderId)
    if (payment) {
      if (payment.status === 'PAID') {
        throw new ConflictError(`Order "${orderId}" has already been paid successfully.`)
      }
      // Reset to PENDING for retry and align provider
      payment = await this.paymentRepo.updateStatus(payment.id, 'PENDING')
      if (payment.provider !== tenantConfig.provider) {
        // Update provider key if changed in config
        payment = await this.paymentRepo.updateStatus(payment.id, 'PENDING')
      }
    } else {
      payment = await this.paymentRepo.create({
        orderId,
        provider: tenantConfig.provider,
        amount: Number(order.totalAmount),
        currency: 'CLP',
      })
    }

    // 6. Request intent from active provider
    const intent = await providerInstance.createIntent(payment.id, Number(order.totalAmount), 'CLP')

    // 7. Save external provider transaction ID
    payment = await this.paymentRepo.updateExternalId(
      payment.id,
      intent.providerTransactionId,
      intent.rawPayload
    )

    // 8. Return mapping according to contract
    return {
      paymentId: payment.id,
      provider: tenantConfig.provider,
      externalId: payment.externalId,
      checkoutUrl: intent.checkoutUrl,
      status: payment.status as 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED',
    }
  }

  /**
   * Compatibility method for legacy checkout integration.
   * Delegates internally to createPaymentIntent().
   */
  async initiatePayment(
    orderId: string,
    _provider: PaymentProvider,
    _amount: Money,
    _currency?: string
  ): Promise<InitiatePaymentResult> {
    const intent = await this.createPaymentIntent(orderId)
    return {
      payment: (await this.paymentRepo.findById(intent.paymentId)) as Payment,
      orderNumber: (await this.orderRepo.findById(orderId))?.orderNumber || '0',
      checkoutUrl: intent.checkoutUrl || '',
      expiresAt: new Date(Date.now() + 1800 * 1000),
      estimatedPreparationTime: 15,
    }
  }

  /**
   * Processes a webhook callback from a payment provider.
   */
  async processProviderWebhook(
    provider: PaymentProvider,
    headers: Record<string, string>,
    rawBody: string
  ): Promise<Payment> {
    // 1. Decode body structure (mock parsing) to match context
    let parsedPayload: Record<string, unknown> = {}
    try {
      parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
    } catch {}

    const providerTransactionId = String(
      parsedPayload.providerTransactionId || parsedPayload.id || ''
    )
    const paymentId = String(parsedPayload.paymentId || parsedPayload.payment_id || '')

    // 2. Retrieve payment record (match by external ID or internal ID)
    let payment = await this.paymentRepo.findByExternalId(provider, providerTransactionId)
    if (!payment && paymentId) {
      payment = await this.paymentRepo.findById(paymentId)
    }

    if (!payment) {
      throw new NotFoundError('Payment', paymentId || providerTransactionId)
    }

    // 3. Webhook Idempotency Check (run first to avoid queries/sig validation on processed payments)
    if (payment.status === 'PAID' || payment.status === 'FAILED' || payment.status === 'REFUNDED') {
      console.log(
        `[PaymentService.processProviderWebhook] Webhook transaction "${providerTransactionId}" already processed (status: ${payment.status}). Ignoring.`
      )
      return payment
    }

    // 4. Resolve location configuration to get specific provider instance
    const order = await this.orderRepo.findById(payment.orderId)
    if (!order) {
      throw new NotFoundError('Order', payment.orderId)
    }

    const tenantConfig = await this.tenantConfigRepo.resolvePaymentConfig(order.locationId)
    const tenantProvider = PaymentProviderFactory.build(tenantConfig)

    // 5. Validate signature via tenant-specific provider
    const verified = await tenantProvider.verifyWebhook(headers, rawBody)
    if (!verified.isValid) {
      throw new ValidationError('Invalid webhook signature')
    }

    // 6. Handle state transition
    if (verified.status === 'PAID') {
      // Confirm payment in database
      payment = await this.paymentRepo.confirm(payment.id, {
        externalId: verified.providerTransactionId,
        paidAt: new Date(),
        metadata: { webhookProcessedAt: new Date().toISOString() },
      })

      // Update OrderStatus to CONFIRMED (ready for kitchen)
      await this.orderService.confirmOrder(payment.orderId)
    } else if (verified.status === 'FAILED') {
      payment = await this.paymentRepo.markFailed(
        payment.id,
        'Transaction rejected by payment gateway webhook'
      )
    } else if (verified.status === 'REFUNDED') {
      payment = await this.paymentRepo.markRefunded(payment.id)
      await this.orderService.cancelOrder(payment.orderId, 'Pago reembolsado por la pasarela')
    }

    return payment
  }

  /**
   * Refirms a payment transaction manually or via active sync.
   */
  async syncPaymentStatus(paymentId: string): Promise<Payment> {
    let payment = await this.paymentRepo.findById(paymentId)
    if (!payment) {
      throw new NotFoundError('Payment', paymentId)
    }

    if (payment.status === 'PAID' || !payment.externalId) {
      return payment
    }

    // Resolve specific provider instance
    const order = await this.orderRepo.findById(payment.orderId)
    if (!order) throw new NotFoundError('Order', payment.orderId)
    const tenantConfig = await this.tenantConfigRepo.resolvePaymentConfig(order.locationId)
    const tenantProvider = PaymentProviderFactory.build(tenantConfig)

    // Poll the provider for current status
    const status = await tenantProvider.fetchStatus(payment.externalId)
    if (status === 'PAID') {
      payment = await this.paymentRepo.confirm(payment.id, {
        externalId: payment.externalId,
        paidAt: new Date(),
        metadata: { syncProcessedAt: new Date().toISOString() },
      })
      await this.orderService.confirmOrder(payment.orderId)
    } else if (status === 'FAILED') {
      payment = await this.paymentRepo.markFailed(
        payment.id,
        'Transaction failed active status check'
      )
    }

    return payment
  }

  /**
   * Initiates a refund for a payment.
   */
  async refundPayment(paymentId: string): Promise<Payment> {
    let payment = await this.paymentRepo.findById(paymentId)
    if (!payment) {
      throw new NotFoundError('Payment', paymentId)
    }

    if (payment.status !== 'PAID') {
      throw new ValidationError(
        `Cannot refund payment in status "${payment.status}". Must be PAID.`
      )
    }

    if (!payment.externalId) {
      throw new ValidationError('Cannot refund payment without an external transaction ID.')
    }

    // Resolve specific provider instance
    const order = await this.orderRepo.findById(payment.orderId)
    if (!order) throw new NotFoundError('Order', payment.orderId)
    const tenantConfig = await this.tenantConfigRepo.resolvePaymentConfig(order.locationId)
    const tenantProvider = PaymentProviderFactory.build(tenantConfig)

    // Call provider refund API
    const success = await tenantProvider.refund(payment.externalId, payment.amount)
    if (!success) {
      throw new ValidationError('Refund request was rejected by the provider.')
    }

    payment = await this.paymentRepo.markRefunded(payment.id)
    await this.orderService.cancelOrder(payment.orderId, 'Pago reembolsado por administrador')

    return payment
  }
}

// ─── Singleton instantiation ───────────────────────────────────────────────────
import { PrismaPaymentRepository } from '@/repositories/prisma/PrismaPaymentRepository'
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { PrismaTenantConfigurationRepository } from '@/repositories/prisma/PrismaTenantConfigurationRepository'
import { orderService } from '../orders'

const paymentRepo = new PrismaPaymentRepository()
const paymentProvider = PaymentProviderFactory.resolve() // env-based fallback for webhooks
const orderRepo = new PrismaOrderRepository()
const tenantConfigRepo = new PrismaTenantConfigurationRepository()

export const paymentService = new PaymentService(
  paymentRepo,
  paymentProvider,
  orderRepo,
  orderService,
  tenantConfigRepo
)
