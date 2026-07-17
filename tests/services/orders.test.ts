/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from '@/services/orders'
import { ValidationError } from '@/lib/errors'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'

describe('Pedidos - Servicios de Dominio', () => {
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
      markPreparing: vi.fn(),
      markReady: vi.fn(),
      markDelivered: vi.fn(),
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

  describe('createDraftOrder', () => {
    it('debe delegar la creación del borrador de pedido al repositorio con los parámetros recibidos', async () => {
      const expectedOrder = { id: 'ord-123', status: 'DRAFT', locationId: 'loc-1' }
      mockOrderRepo.create.mockResolvedValue(expectedOrder)

      const order = await orderService.createDraftOrder(
        'loc-1',
        'web-channel',
        'cust-1',
        'DINE_IN',
        'Mesa 4',
        'Sin hielo',
        { source: 'unit-test' }
      )

      expect(order).toEqual(expectedOrder)
      expect(mockOrderRepo.create).toHaveBeenCalledWith({
        locationId: 'loc-1',
        channelId: 'web-channel',
        customerId: 'cust-1',
        type: 'DINE_IN',
        tableIdentifier: 'Mesa 4',
        notes: 'Sin hielo',
        metadata: { source: 'unit-test' },
      })
    })
  })

  describe('addItem (Gestión de items y Snapshot Pattern)', () => {
    it('debe agregar un item disponible exitosamente y guardar el snapshot del precio base', async () => {
      const fakeOrder: any = {
        id: 'ord-123',
        locationId: 'loc-1',
        channelId: 'web',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [],
      }

      const fakeMenu: any = {
        id: 'menu-1',
        locationId: 'loc-1',
        categories: [
          {
            id: 'cat-1',
            name: 'Almuerzos',
            sortOrder: 1,
            items: [
              {
                id: 'menu-item-1',
                categoryId: 'cat-1',
                productVariantId: 'variant-1',
                name: 'Pollo con Arroz',
                description: 'Pollo asado',
                imageUrl: null,
                price: 6000,
                isAvailable: true,
                isVisible: true,
                sortOrder: 1,
                productVariant: {
                  id: 'variant-1',
                  productId: 'prod-1',
                  name: 'Pollo con Arroz',
                  sku: 'POL001',
                  product: {
                    id: 'prod-1',
                    organizationId: 'org-1',
                    name: 'Pollo con Arroz',
                    description: '',
                    imageUrl: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as any,
                } as any,
                modifierGroups: [],
                dailyMenuOverride: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
          },
        ],
      }

      let currentOrder = fakeOrder
      mockOrderRepo.findByIdWithItems.mockImplementation(async () => currentOrder)
      mockCatalogRepo.findMenuByLocationId.mockResolvedValue(fakeMenu)

      mockOrderRepo.addItem.mockImplementation(async (orderId: string, itemData: any) => {
        currentOrder = {
          ...fakeOrder,
          items: [
            {
              id: 'item-1',
              orderId,
              menuItemId: itemData.menuItemId,
              productVariantId: itemData.productVariantId,
              name: itemData.name,
              unitPrice: itemData.unitPrice,
              quantity: itemData.quantity,
              subtotal: itemData.subtotal,
              notes: itemData.notes,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            } as any,
          ],
        }
        return {} as any
      })

      const updatedOrder = await orderService.addItem('ord-123', {
        menuItemId: 'menu-item-1',
        productVariantId: 'variant-1',
        quantity: 2,
        notes: 'Bien caliente',
        modifiers: [],
      })

      expect(updatedOrder.items).toHaveLength(1)
      expect(updatedOrder.items[0].unitPrice).toBe(6000)
      expect(updatedOrder.items[0].name).toBe('Pollo con Arroz')
      expect(mockOrderRepo.addItem).toHaveBeenCalledWith('ord-123', {
        menuItemId: 'menu-item-1',
        productVariantId: 'variant-1',
        quantity: 2,
        notes: 'Bien caliente',
        name: 'Pollo con Arroz',
        unitPrice: 6000,
        subtotal: 12000,
        modifiers: [],
      })
    })

    it('debe rechazar la adición si el producto no está disponible o visible', async () => {
      const fakeOrder: any = {
        id: 'ord-123',
        locationId: 'loc-1',
        channelId: 'web',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [],
      }

      const fakeMenu: any = {
        id: 'menu-1',
        locationId: 'loc-1',
        categories: [
          {
            id: 'cat-1',
            name: 'Almuerzos',
            sortOrder: 1,
            items: [
              {
                id: 'menu-item-1',
                categoryId: 'cat-1',
                productVariantId: 'variant-1',
                name: 'Pollo con Arroz',
                description: 'Pollo asado',
                imageUrl: null,
                price: 6000,
                isAvailable: false, // NO DISPONIBLE
                isVisible: true,
                sortOrder: 1,
                productVariant: {
                  id: 'variant-1',
                  productId: 'prod-1',
                  name: 'Pollo con Arroz',
                  sku: 'POL001',
                  product: {
                    id: 'prod-1',
                    organizationId: 'org-1',
                    name: 'Pollo con Arroz',
                    description: '',
                    imageUrl: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as any,
                } as any,
                modifierGroups: [],
                dailyMenuOverride: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
          },
        ],
      }

      mockOrderRepo.findByIdWithItems.mockResolvedValue(fakeOrder)
      mockCatalogRepo.findMenuByLocationId.mockResolvedValue(fakeMenu)

      await expect(
        orderService.addItem('ord-123', {
          menuItemId: 'menu-item-1',
          productVariantId: 'variant-1',
          quantity: 1,
          modifiers: [],
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe rechazar la adición si la cantidad supera el stock diario disponible en el override', async () => {
      const fakeOrder: any = {
        id: 'ord-123',
        locationId: 'loc-1',
        channelId: 'web',
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [],
      }

      const fakeMenu: any = {
        id: 'menu-1',
        locationId: 'loc-1',
        categories: [
          {
            id: 'cat-1',
            name: 'Almuerzos',
            sortOrder: 1,
            items: [
              {
                id: 'menu-item-1',
                categoryId: 'cat-1',
                productVariantId: 'variant-1',
                name: 'Pollo con Arroz',
                description: 'Pollo asado',
                imageUrl: null,
                price: 6000,
                isAvailable: true,
                isVisible: true,
                sortOrder: 1,
                productVariant: {
                  id: 'variant-1',
                  productId: 'prod-1',
                  name: 'Pollo con Arroz',
                  sku: 'POL001',
                  product: {
                    id: 'prod-1',
                    organizationId: 'org-1',
                    name: 'Pollo con Arroz',
                    description: '',
                    imageUrl: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  } as any,
                } as any,
                modifierGroups: [],
                dailyMenuOverride: {
                  id: 'override-1',
                  menuItemId: 'menu-item-1',
                  price: 5500,
                  isAvailable: true,
                  stockDaily: 3, // STOCK LIMITADO A 3
                  isHighlighted: false,
                  isVisible: true,
                  sortOrder: 1,
                  notes: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              },
            ],
          },
        ],
      }

      mockOrderRepo.findByIdWithItems.mockResolvedValue(fakeOrder)
      mockCatalogRepo.findMenuByLocationId.mockResolvedValue(fakeMenu)

      // Intentar agregar 5 unidades (supera el stock de 3)
      await expect(
        orderService.addItem('ord-123', {
          menuItemId: 'menu-item-1',
          productVariantId: 'variant-1',
          quantity: 5,
          modifiers: [],
        })
      ).rejects.toThrow(ValidationError)
    })
  })
})
