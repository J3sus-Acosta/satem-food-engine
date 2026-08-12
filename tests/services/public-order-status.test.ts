/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from '@/services/orders'
import { ValidationError } from '@/lib/errors'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'
import type { OrderWithItems } from '@/types'

describe('Consulta Pública de Estado de Pedidos - Servicios de Dominio', () => {
  let orderService: OrderService
  let mockOrderRepo: any
  let mockCatalogRepo: any

  const sampleActiveOrders: OrderWithItems[] = [
    {
      id: 'ord-100',
      orderNumber: '#100',
      locationId: 'loc-1',
      customerId: null,
      channelId: 'chan-1',
      status: 'PREPARING',
      type: 'TAKEAWAY',
      tableIdentifier: null,
      notes: null,
      subtotal: 10000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 10000,
      confirmedAt: new Date(),
      preparedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancellationReason: null,
      metadata: { customerName: 'Pedro PEDIDO WEB', customerPhone: '+56912345678' },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [
        {
          id: 'item-1',
          orderId: 'ord-100',
          menuItemId: 'mi-1',
          productVariantId: 'pv-1',
          name: 'Hamburguesa Italiana',
          unitPrice: 5000,
          quantity: 2,
          subtotal: 10000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          modifiers: [
            {
              id: 'm-1',
              orderItemId: 'item-1',
              modifierId: 'mod-1',
              name: 'Queso Extra',
              priceExtra: 500,
              createdAt: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 'ord-101',
      orderNumber: '#101',
      locationId: 'loc-1',
      customerId: null,
      channelId: 'chan-1',
      status: 'READY',
      type: 'TAKEAWAY',
      tableIdentifier: null,
      notes: null,
      subtotal: 3000,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 3000,
      confirmedAt: new Date(),
      preparedAt: new Date(),
      deliveredAt: null,
      cancelledAt: null,
      cancellationReason: null,
      metadata: { customerName: 'Pedro PEDIDO WEB', customerPhone: '+56912345678' },
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      items: [
        {
          id: 'item-2',
          orderId: 'ord-101',
          menuItemId: 'mi-2',
          productVariantId: 'pv-2',
          name: 'Papas Fritas',
          unitPrice: 3000,
          quantity: 1,
          subtotal: 3000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          modifiers: [],
        },
      ],
    },
  ]

  beforeEach(() => {
    mockOrderRepo = {
      findActivePublicOrders: vi.fn(),
    }
    mockCatalogRepo = {}

    orderService = new OrderService(
      mockOrderRepo as IOrderRepository,
      mockCatalogRepo as ICatalogRepository
    )
  })

  it('debe fallar si no se envía ni número de pedido ni teléfono', async () => {
    await expect(orderService.lookupPublicOrderStatus('loc-1', {})).rejects.toThrow(ValidationError)
  })

  it('debe devolver únicamente pedidos activos y formateados correctamente', async () => {
    mockOrderRepo.findActivePublicOrders.mockResolvedValue(sampleActiveOrders)

    const results = await orderService.lookupPublicOrderStatus('loc-1', {
      phone: '912345678',
    })

    expect(mockOrderRepo.findActivePublicOrders).toHaveBeenCalledWith('loc-1', {
      phone: '912345678',
    })

    expect(results).toHaveLength(2)

    expect(results[0]).toEqual({
      orderNumber: '#100',
      status: 'PREPARING',
      statusLabel: 'EN PREPARACIÓN',
      statusDescription: 'Tu pedido está siendo preparado por nuestra cocina.',
      createdAt: expect.any(Date),
      items: [
        {
          name: 'Hamburguesa Italiana',
          quantity: 2,
          modifiers: ['Queso Extra'],
        },
      ],
    })

    expect(results[1]).toEqual({
      orderNumber: '#101',
      status: 'READY',
      statusLabel: 'LISTO PARA RETIRAR',
      statusDescription: '¡Tu pedido está listo! Puedes acercarte al mostrador a retirarlo.',
      createdAt: expect.any(Date),
      items: [
        {
          name: 'Papas Fritas',
          quantity: 1,
          modifiers: [],
        },
      ],
    })
  })

  it('debe retornar lista vacía cuando no existen pedidos activos para los datos ingresados', async () => {
    mockOrderRepo.findActivePublicOrders.mockResolvedValue([])

    const results = await orderService.lookupPublicOrderStatus('loc-1', {
      orderNumber: '#999',
    })

    expect(results).toEqual([])
  })
})
