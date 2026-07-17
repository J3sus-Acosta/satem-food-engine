/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from '@/services/orders'
import { ValidationError } from '@/lib/errors'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'

describe('Checkout Cliente - Servicios de Dominio', () => {
  let orderService: OrderService
  let mockOrderRepo: any
  let mockCatalogRepo: any

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByIdWithItems: vi.fn(),
      findByLocationId: vi.fn(),
      create: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
      findDefaultChannelId: vi.fn(),
      nextOrderNumber: vi.fn(),
    }

    mockCatalogRepo = {
      findMenuByLocationId: vi.fn(),
      findMenuByLocationSlug: vi.fn(),
      findCategoriesByMenuId: vi.fn(),
      findProductsByOrganizationId: vi.fn(),
      findProductBySlug: vi.fn(),
      findMenuItemBySku: vi.fn(),
      upsertDailyMenuOverride: vi.fn(),
    }

    orderService = new OrderService(
      mockOrderRepo as IOrderRepository,
      mockCatalogRepo as ICatalogRepository
    )
  })

  it('debe fallar si el checkout no contiene ítems', async () => {
    await expect(
      orderService.createCustomerOrder('loc-1', {
        customerName: 'Juan',
        customerPhone: '+56912345678',
        items: [],
      })
    ).rejects.toThrow(ValidationError)
  })

  it('debe fallar si no se encuentra canal activo para el local', async () => {
    mockOrderRepo.findDefaultChannelId.mockResolvedValue(null)

    await expect(
      orderService.createCustomerOrder('loc-1', {
        customerName: 'Juan',
        customerPhone: '+56912345678',
        items: [{ menuItemId: 'item-1', quantity: 1 }],
      })
    ).rejects.toThrow(ValidationError)
  })

  it('debe orquestar exitosamente la creación y adición de ítems', async () => {
    const mockOrder = { id: 'ord-999', orderNumber: '0001', locationId: 'loc-1', status: 'DRAFT' }
    mockOrderRepo.findDefaultChannelId.mockResolvedValue('chan-web')
    mockOrderRepo.create.mockResolvedValue(mockOrder)
    mockOrderRepo.findByIdWithItems.mockResolvedValue({
      ...mockOrder,
      items: [
        {
          id: 'item-row-1',
          menuItemId: 'item-1',
          productVariantId: 'var-1',
          quantity: 2,
          unitPrice: 5000,
          subtotal: 10000,
        },
      ],
    })

    const mockMenu = {
      id: 'menu-1',
      locationId: 'loc-1',
      name: 'Menú Santiago',
      description: 'Menú diario',
      isActive: true,
      categories: [
        {
          id: 'cat-1',
          name: 'Hamburguesas',
          sortOrder: 1,
          items: [
            {
              id: 'item-1',
              name: 'Simple Burger',
              price: 5000,
              isAvailable: true,
              isVisible: true,
              productVariantId: 'var-1',
              productVariant: {
                id: 'var-1',
                productId: 'prod-1',
                name: 'Simple',
                sku: 'SMP-1',
                isDefault: true,
                isActive: true,
                product: { id: 'prod-1', name: 'Burger' },
              },
              modifierGroups: [],
            },
          ],
        },
      ],
    }
    mockCatalogRepo.findMenuByLocationId.mockResolvedValue(mockMenu)

    // Run checkout
    const result = await orderService.createCustomerOrder('loc-1', {
      customerName: 'Juan',
      customerPhone: '+56912345678',
      items: [{ menuItemId: 'item-1', quantity: 2, modifiers: [], notes: 'Sin cebolla' }],
    })

    // Assertions
    expect(mockOrderRepo.findDefaultChannelId).toHaveBeenCalledWith('loc-1')
    expect(mockOrderRepo.create).toHaveBeenCalledWith({
      locationId: 'loc-1',
      channelId: 'chan-web',
      customerId: undefined,
      type: 'TAKEAWAY',
      tableIdentifier: undefined,
      notes: undefined,
      metadata: { customerName: 'Juan', customerPhone: '+56912345678' },
    })

    expect(mockOrderRepo.addItem).toHaveBeenCalledWith('ord-999', {
      menuItemId: 'item-1',
      productVariantId: 'var-1',
      quantity: 2,
      notes: 'Sin cebolla',
      name: 'Simple Burger',
      unitPrice: 5000,
      subtotal: 10000,
      modifiers: [],
    })

    expect(result).toBeDefined()
    expect(result.id).toBe('ord-999')
    expect(result.items.length).toBe(1)
  })
})
