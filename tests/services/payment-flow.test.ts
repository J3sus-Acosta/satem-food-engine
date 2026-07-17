/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaymentService } from '@/services/payments'
import type {
  IPaymentRepository,
  IOrderRepository,
  ITenantConfigurationRepository,
} from '@/repositories'
import type { IPaymentProvider } from '@/integrations'
import type { OrderService } from '@/services/orders'
import type { Payment, PaymentConfiguration } from '@/types'

describe('Flujo de Pagos Completo (Fase 9A)', () => {
  let paymentService: PaymentService
  let mockPaymentRepo: any
  let mockOrderRepo: any
  let mockOrderService: any
  let mockTenantConfigRepo: any
  let mockPaymentProvider: any

  beforeEach(() => {
    mockPaymentRepo = {
      findById: vi.fn(),
      findByOrderId: vi.fn(),
      findByExternalId: vi.fn(),
      create: vi.fn(),
      confirm: vi.fn(),
      markFailed: vi.fn(),
      updateExternalId: vi.fn(),
      updateStatus: vi.fn(),
    }

    mockOrderRepo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    }

    mockOrderService = {
      confirmOrder: vi.fn(),
      cancelOrder: vi.fn(),
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

  it('1. Debe crear un intent de pago correctamente', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'DRAFT',
      locationId: 'loc-abc',
      totalAmount: 15000,
    }
    const mockConfig: PaymentConfiguration = {
      provider: 'SUMUP',
      configuration: { webhookSecret: 'secret_1' },
    }
    const mockPayment: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'SUMUP',
      status: 'PENDING',
      amount: 15000,
      currency: 'CLP',
      externalId: null,
      externalReference: null,
      paidAt: null,
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockOrderRepo.findById.mockResolvedValue(mockOrder)
    mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(mockConfig)
    mockPaymentRepo.findByOrderId.mockResolvedValue(null)
    mockPaymentRepo.create.mockResolvedValue(mockPayment)
    mockPaymentRepo.updateExternalId.mockResolvedValue({
      ...mockPayment,
      externalId: 'ext_sumup_abc',
    })

    // Act
    const result = await paymentService.createPaymentIntent('ord-123')

    // Assert
    expect(mockOrderRepo.findById).toHaveBeenCalledWith('ord-123')
    expect(mockTenantConfigRepo.resolvePaymentConfig).toHaveBeenCalledWith('loc-abc')
    expect(mockPaymentRepo.create).toHaveBeenCalledWith({
      orderId: 'ord-123',
      provider: 'SUMUP',
      amount: 15000,
      currency: 'CLP',
    })
    expect(result.paymentId).toBe('pay-789')
    expect(result.provider).toBe('SUMUP')
    expect(result.externalId).toBe('ext_sumup_abc')
    expect(result.checkoutUrl).toContain('mock.sumup.com')
  })

  it('2. Debe seleccionar Webpay según configuración del tenant', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'DRAFT',
      locationId: 'loc-abc',
      totalAmount: 15000,
    }
    const mockConfig: PaymentConfiguration = {
      provider: 'WEBPAY',
      configuration: { commerceCode: 'wp_code_99' },
    }
    const mockPayment: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'WEBPAY',
      status: 'PENDING',
      amount: 15000,
      currency: 'CLP',
      externalId: null,
      externalReference: null,
      paidAt: null,
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockOrderRepo.findById.mockResolvedValue(mockOrder)
    mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(mockConfig)
    mockPaymentRepo.findByOrderId.mockResolvedValue(null)
    mockPaymentRepo.create.mockResolvedValue(mockPayment)
    mockPaymentRepo.updateExternalId.mockResolvedValue({
      ...mockPayment,
      externalId: 'ext_webpay_abc',
    })

    // Act
    const result = await paymentService.createPaymentIntent('ord-123')

    // Assert
    expect(result.provider).toBe('WEBPAY')
    expect(result.externalId).toBe('ext_webpay_abc')
    expect(result.checkoutUrl).toContain('mock.webpay.cl')
  })

  it('3. Debe seleccionar SumUp por fallback (configuración resuelta)', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'DRAFT',
      locationId: 'loc-abc',
      totalAmount: 15000,
    }
    const mockConfig: PaymentConfiguration = {
      provider: 'SUMUP',
      configuration: {},
    }
    const mockPayment: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'SUMUP',
      status: 'PENDING',
      amount: 15000,
      currency: 'CLP',
      externalId: null,
      externalReference: null,
      paidAt: null,
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockOrderRepo.findById.mockResolvedValue(mockOrder)
    mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(mockConfig)
    mockPaymentRepo.findByOrderId.mockResolvedValue(null)
    mockPaymentRepo.create.mockResolvedValue(mockPayment)
    mockPaymentRepo.updateExternalId.mockResolvedValue({
      ...mockPayment,
      externalId: 'ext_sumup_fallback',
    })

    // Act
    const result = await paymentService.createPaymentIntent('ord-123')

    // Assert
    expect(result.provider).toBe('SUMUP')
    expect(result.checkoutUrl).toContain('mock.sumup.com')
  })

  it('4. Idempotencia: Webhook duplicado no cambia de estado', async () => {
    // Arrange
    const mockPaymentPaid: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'SUMUP',
      status: 'PAID', // Already paid
      amount: 15000,
      currency: 'CLP',
      externalId: 'sumup_tx_already_done',
      externalReference: null,
      paidAt: new Date(),
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPaymentRepo.findByExternalId.mockResolvedValue(mockPaymentPaid)

    const headers = { 'x-mock-signature': 'true' }
    const rawBody = JSON.stringify({
      providerTransactionId: 'sumup_tx_already_done',
      paymentId: 'pay-789',
      amount: 15000,
      status: 'PAID',
    })

    // Act
    const result = await paymentService.processProviderWebhook('SUMUP', headers, rawBody)

    // Assert
    expect(result.status).toBe('PAID')
    expect(mockPaymentRepo.confirm).not.toHaveBeenCalled()
    expect(mockOrderService.confirmOrder).not.toHaveBeenCalled()
  })

  it('5. Pago aprobado cambia order a CONFIRMED (recibido cocina)', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'DRAFT',
      locationId: 'loc-abc',
      totalAmount: 15000,
    }
    const mockConfig: PaymentConfiguration = {
      provider: 'SUMUP',
      configuration: { webhookSecret: 'sec' },
    }
    const mockPaymentPending: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'SUMUP',
      status: 'PENDING',
      amount: 15000,
      currency: 'CLP',
      externalId: 'sumup_tx_new',
      externalReference: null,
      paidAt: null,
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPaymentRepo.findByExternalId.mockResolvedValue(mockPaymentPending)
    mockOrderRepo.findById.mockResolvedValue(mockOrder)
    mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(mockConfig)
    mockPaymentRepo.confirm.mockResolvedValue({
      ...mockPaymentPending,
      status: 'PAID',
    })

    const headers = { 'x-mock-signature': 'true' }
    const rawBody = JSON.stringify({
      providerTransactionId: 'sumup_tx_new',
      paymentId: 'pay-789',
      amount: 15000,
      status: 'PAID',
    })

    // Act
    const result = await paymentService.processProviderWebhook('SUMUP', headers, rawBody)

    // Assert
    expect(result.status).toBe('PAID')
    expect(mockPaymentRepo.confirm).toHaveBeenCalledWith('pay-789', expect.any(Object))
    expect(mockOrderService.confirmOrder).toHaveBeenCalledWith('ord-123')
  })

  it('6. Pago rechazado no completa pedido y deja Payment como FAILED', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'DRAFT',
      locationId: 'loc-abc',
      totalAmount: 15000,
    }
    const mockConfig: PaymentConfiguration = {
      provider: 'SUMUP',
      configuration: { webhookSecret: 'sec' },
    }
    const mockPaymentPending: Payment = {
      id: 'pay-789',
      orderId: 'ord-123',
      provider: 'SUMUP',
      status: 'PENDING',
      amount: 15000,
      currency: 'CLP',
      externalId: 'sumup_tx_failed',
      externalReference: null,
      paidAt: null,
      failureReason: null,
      receiptUrl: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockPaymentRepo.findByExternalId.mockResolvedValue(mockPaymentPending)
    mockOrderRepo.findById.mockResolvedValue(mockOrder)
    mockTenantConfigRepo.resolvePaymentConfig.mockResolvedValue(mockConfig)
    mockPaymentRepo.markFailed.mockResolvedValue({
      ...mockPaymentPending,
      status: 'FAILED',
    })

    const headers = { 'x-mock-signature': 'true' }
    const rawBody = JSON.stringify({
      providerTransactionId: 'sumup_tx_failed',
      paymentId: 'pay-789',
      amount: 15000,
      status: 'FAILED',
    })

    // Act
    const result = await paymentService.processProviderWebhook('SUMUP', headers, rawBody)

    // Assert
    expect(result.status).toBe('FAILED')
    expect(mockPaymentRepo.markFailed).toHaveBeenCalledWith('pay-789', expect.any(String))
    expect(mockOrderService.confirmOrder).not.toHaveBeenCalled()
  })
})
