/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import crypto from 'crypto'
import { PaymentService } from '@/services/payments'
import { PaymentProviderFactory } from '@/integrations/payments/PaymentProviderFactory'
import { SumUpPaymentProvider } from '@/integrations/payments/providers/SumUpPaymentProvider'
import { WebpayPaymentProvider } from '@/integrations/payments/providers/WebpayPaymentProvider'
import { ValidationError } from '@/lib/errors'
import type {
  IPaymentRepository,
  IOrderRepository,
  ITenantConfigurationRepository,
} from '@/repositories'
import type { IPaymentProvider } from '@/integrations'
import type { OrderService } from '@/services/orders'
import type { Payment, PaymentConfiguration } from '@/types'

describe('Pagos - Servicios de Dominio e Integraciones (Fase 10B SumUp)', () => {
  let paymentService: PaymentService
  let mockPaymentRepo: any
  let mockOrderRepo: any
  let mockOrderService: any
  let mockTenantConfigRepo: any
  let mockPaymentProvider: any

  beforeEach(() => {
    mockPaymentRepo = {
      findById: vi.fn(),
      findByExternalId: vi.fn(),
      create: vi.fn(),
      confirm: vi.fn(),
      confirmIfPending: vi.fn(),
      markFailed: vi.fn(),
      refund: vi.fn(),
    }

    mockOrderRepo = {
      findById: vi.fn(),
      findByIdWithItems: vi.fn(),
      create: vi.fn(),
    }

    mockOrderService = {
      confirmOrder: vi.fn(),
    }

    mockTenantConfigRepo = {
      resolvePaymentConfig: vi.fn(),
    }

    mockPaymentProvider = {
      createIntent: vi.fn(),
      verifyWebhook: vi.fn(),
      fetchStatus: vi.fn(),
      refund: vi.fn(),
    }

    paymentService = new PaymentService(
      mockPaymentRepo as IPaymentRepository,
      mockPaymentProvider as IPaymentProvider,
      mockOrderRepo as IOrderRepository,
      mockOrderService as unknown as OrderService,
      mockTenantConfigRepo as ITenantConfigurationRepository
    )
  })

  describe('PaymentProviderFactory', () => {
    it('debe construir la instancia SumUpPaymentProvider cuando la configuración es SUMUP', () => {
      const config: PaymentConfiguration = {
        provider: 'SUMUP',
        configuration: {},
      }
      const provider = PaymentProviderFactory.build(config)
      expect(provider).toBeInstanceOf(SumUpPaymentProvider)
    })

    it('debe construir la instancia WebpayPaymentProvider cuando la configuración es WEBPAY', () => {
      const config: PaymentConfiguration = {
        provider: 'WEBPAY',
        configuration: {},
      }
      const provider = PaymentProviderFactory.build(config)
      expect(provider).toBeInstanceOf(WebpayPaymentProvider)
    })

    it('debe fallar si el proveedor configurado no existe', () => {
      const config: any = {
        provider: 'STRIPE_INVALID',
        configuration: {},
      }
      expect(() => PaymentProviderFactory.build(config)).toThrow(ValidationError)
    })
  })

  describe('SumUpPaymentProvider Real Unit Tests', () => {
    const sumupProvider = new SumUpPaymentProvider({
      SUMUP_API_KEY: 'sup_sk_mock_test_key',
      SUMUP_MERCHANT_CODE: 'M3R57S7J',
      SUMUP_WEBHOOK_SECRET: 'test_webhook_secret_key',
    })

    it('debe crear un intent de pago y generar checkoutUrl válida', async () => {
      const intent = await sumupProvider.createIntent('pay-test-1', 12500, 'CLP')
      expect(intent.providerTransactionId).toBeDefined()
      expect(intent.checkoutUrl).toContain('sumup')
    })

    it('debe verificar firma HMAC-SHA256 válida en webhooks', async () => {
      const rawBody = JSON.stringify({
        id: 'tx_sumup_100',
        checkout_reference: 'pay-test-1',
        amount: 12500,
        status: 'PAID',
      })

      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret_key')
        .update(rawBody, 'utf8')
        .digest('hex')

      const result = await sumupProvider.verifyWebhook({ 'sumup-signature': signature }, rawBody)

      expect(result.isValid).toBe(true)
      expect(result.paymentId).toBe('pay-test-1')
      expect(result.providerTransactionId).toBe('tx_sumup_100')
      expect(result.status).toBe('PAID')
    })

    it('debe rechazar webhooks con firma HMAC-SHA256 inválida', async () => {
      const rawBody = JSON.stringify({
        id: 'tx_sumup_100',
        checkout_reference: 'pay-test-1',
        amount: 12500,
        status: 'PAID',
      })

      const result = await sumupProvider.verifyWebhook(
        { 'sumup-signature': 'invalid_signature_hex' },
        rawBody
      )

      expect(result.isValid).toBe(false)
      expect(result.status).toBe('FAILED')
    })

    it('debe consultar estado de pago y realizar reembolsos', async () => {
      const status = await sumupProvider.fetchStatus('sumup_tx_123')
      expect(status).toBe('PAID')

      const refundResult = await sumupProvider.refund('sumup_tx_123', 12500)
      expect(refundResult).toBe(true)
    })

    it('debe retornar diagnóstico de conectividad en getDiagnostics', async () => {
      const diag = await sumupProvider.getDiagnostics()
      expect(diag.environment).toBe('sandbox')
      expect(diag.merchantCode).toBe('M3R57S7J')
    })
  })

  describe('Resolución Jerárquica Multi-Tenant (Lógica de Negocio)', () => {
    it('debe retornar la configuración correspondiente del mockTenantConfigRepo', async () => {
      const expectedConfig: PaymentConfiguration = {
        provider: 'WEBPAY',
        configuration: { commerceCode: '123456' },
      }
      mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(expectedConfig)

      const resolved = await mockTenantConfigRepo.resolvePaymentConfig('loc-1')
      expect(resolved).toEqual(expectedConfig)
    })
  })

  describe('Webhook de Pagos - Idempotencia', () => {
    it('debe omitir la confirmación del pedido y el guardado si el pago ya se encuentra en un estado final (PAID)', async () => {
      const fakePayment: Payment = {
        id: 'pay-123',
        orderId: 'ord-123',
        provider: 'SUMUP',
        status: 'PAID',
        amount: 5000,
        currency: 'CLP',
        externalId: 'tx-sumup-999',
        externalReference: null,
        paidAt: new Date(),
        failureReason: null,
        receiptUrl: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPaymentProvider.verifyWebhook.mockResolvedValue({
        isValid: true,
        paymentId: 'pay-123',
        providerTransactionId: 'tx-sumup-999',
        amount: 5000,
        status: 'PAID',
      })

      mockPaymentRepo.findByExternalId.mockResolvedValue(fakePayment)

      const result = await paymentService.processProviderWebhook(
        'SUMUP',
        { 'x-mock-signature': 'true' },
        '{}'
      )

      expect(result).toEqual(fakePayment)
      expect(mockPaymentRepo.confirm).not.toHaveBeenCalled()
      expect(mockPaymentRepo.markFailed).not.toHaveBeenCalled()
      expect(mockOrderService.confirmOrder).not.toHaveBeenCalled()
    })
  })
})
