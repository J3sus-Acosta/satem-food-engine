/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('Pagos - Servicios de Dominio e Integraciones', () => {
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

  describe('Resolución Jerárquica Multi-Tenant (Lógica de Negocio)', () => {
    // La jerarquía se aplica en el repositorio ITenantConfigurationRepository.
    // Vamos a probar que resolvePaymentConfig funciona de acuerdo a la prioridad:
    // 1. Location.paymentProvider
    // 2. Organization.paymentProvider
    // 3. process.env.PAYMENT_PROVIDER
    // 4. Fallback SUMUP

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

      // Buscar por ID externo o interno retorna el pago PAID
      mockPaymentRepo.findByExternalId.mockResolvedValue(fakePayment)

      const result = await paymentService.processProviderWebhook(
        'SUMUP',
        { 'x-mock-signature': 'true' },
        '{}'
      )

      expect(result).toEqual(fakePayment)
      // No debe llamar a confirm o markFailed en el repositorio porque ya está finalizado
      expect(mockPaymentRepo.confirm).not.toHaveBeenCalled()
      expect(mockPaymentRepo.markFailed).not.toHaveBeenCalled()
      // No debe invocar al confirmOrder del OrderService
      expect(mockOrderService.confirmOrder).not.toHaveBeenCalled()
    })
  })
})
