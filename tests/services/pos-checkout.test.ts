import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from '@/services/orders'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'

type MockOrderRepo = {
  [K in keyof IOrderRepository]: ReturnType<typeof vi.fn>
}
type MockCatalogRepo = {
  [K in keyof ICatalogRepository]: ReturnType<typeof vi.fn>
}

describe('POS & Cashier Domain Flow', () => {
  let orderService: OrderService
  let mockOrderRepo: MockOrderRepo
  let mockCatalogRepo: MockCatalogRepo

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByIdWithItems: vi.fn(),
      findByLocationId: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateStatus: vi.fn(),
      updateDiscountAndTotals: vi.fn(),
      findDefaultChannelId: vi.fn(),
    } as unknown as MockOrderRepo

    mockCatalogRepo = {
      findMenuByLocationId: vi.fn(),
      findMenuByLocationSlug: vi.fn(),
    } as unknown as MockCatalogRepo

    orderService = new OrderService(
      mockOrderRepo as unknown as IOrderRepository,
      mockCatalogRepo as unknown as ICatalogRepository
    )
  })

  it('debe aplicar un descuento y recalcular los totales correctamente', async () => {
    const mockOrder = {
      id: 'ord-pos-1',
      orderNumber: '#010',
      locationId: 'loc-pos',
      status: 'DRAFT',
      subtotal: 5000,
      discountAmount: 0,
      totalAmount: 5000,
      items: [],
    }

    mockOrderRepo.findByIdWithItems.mockResolvedValueOnce(mockOrder).mockResolvedValueOnce({
      ...mockOrder,
      discountAmount: 1000,
      totalAmount: 4000,
      notes: 'Descuento 20%',
    })

    const result = await orderService.applyDiscount('ord-pos-1', 1000, 'Descuento 20%')

    expect(mockOrderRepo.updateDiscountAndTotals).toHaveBeenCalledWith(
      'ord-pos-1',
      1000,
      'Descuento 20%'
    )
    expect(result.discountAmount).toBe(1000)
    expect(result.totalAmount).toBe(4000)
  })

  it('debe soportar comida de empleado con 100% de descuento ($0 total)', async () => {
    const mockOrder = {
      id: 'ord-pos-staff',
      orderNumber: '#011',
      locationId: 'loc-pos',
      status: 'DRAFT',
      subtotal: 7500,
      discountAmount: 0,
      totalAmount: 7500,
      items: [],
    }

    mockOrderRepo.findByIdWithItems.mockResolvedValueOnce(mockOrder).mockResolvedValueOnce({
      ...mockOrder,
      discountAmount: 7500,
      totalAmount: 0,
      notes: 'Colación Empleado: Juan (Cocina)',
    })

    const result = await orderService.applyDiscount(
      'ord-pos-staff',
      7500,
      'Colación Empleado: Juan (Cocina)'
    )

    expect(mockOrderRepo.updateDiscountAndTotals).toHaveBeenCalledWith(
      'ord-pos-staff',
      7500,
      'Colación Empleado: Juan (Cocina)'
    )
    expect(result.discountAmount).toBe(7500)
    expect(result.totalAmount).toBe(0)
  })
})
