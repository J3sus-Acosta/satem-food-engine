/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OrderService } from '@/services/orders'
import { KitchenService } from '@/services/kitchen'
import { ConflictError } from '@/lib/errors'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'

describe('KDS y Ciclo de Cocina (Fase 9B)', () => {
  let orderService: OrderService
  let kitchenService: KitchenService
  let mockOrderRepo: any
  let mockCatalogRepo: any

  beforeEach(() => {
    mockOrderRepo = {
      findById: vi.fn(),
      findByIdWithItems: vi.fn(),
      updateStatus: vi.fn(),
      findKitchenQueue: vi.fn(),
    }

    mockCatalogRepo = {
      findMenuByLocationId: vi.fn(),
    }

    orderService = new OrderService(
      mockOrderRepo as IOrderRepository,
      mockCatalogRepo as ICatalogRepository
    )

    kitchenService = new KitchenService(mockOrderRepo as IOrderRepository, orderService)
  })

  it('1. Pedido pagado (CONFIRMED) debe aparecer en la cola de la cocina', async () => {
    // Arrange
    const mockConfirmedOrder = {
      id: 'ord-paid',
      status: 'CONFIRMED',
      locationId: 'loc-1',
    }
    mockOrderRepo.findKitchenQueue.mockResolvedValue([mockConfirmedOrder])

    // Act
    const queue = await kitchenService.getActiveTickets('loc-1')

    // Assert
    expect(mockOrderRepo.findKitchenQueue).toHaveBeenCalledWith('loc-1')
    expect(queue.length).toBe(1)
    expect(queue[0].id).toBe('ord-paid')
  })

  it('2. PENDING_PREPARATION (CONFIRMED) puede pasar a PREPARING', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'CONFIRMED',
      locationId: 'loc-1',
    }
    mockOrderRepo.findByIdWithItems.mockResolvedValue(mockOrder)
    mockOrderRepo.updateStatus.mockResolvedValue(true)

    // Act
    await orderService.startPreparing('ord-123')

    // Assert
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('ord-123', 'PREPARING')
  })

  it('3. PREPARING puede pasar a READY', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'PREPARING',
      locationId: 'loc-1',
    }
    mockOrderRepo.findByIdWithItems.mockResolvedValue(mockOrder)
    mockOrderRepo.updateStatus.mockResolvedValue(true)

    // Act
    await orderService.markReady('ord-123')

    // Assert
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('ord-123', 'READY')
  })

  it('4. READY puede pasar a COMPLETED (DELIVERED)', async () => {
    // Arrange
    const mockOrder = {
      id: 'ord-123',
      status: 'READY',
      locationId: 'loc-1',
    }
    mockOrderRepo.findByIdWithItems.mockResolvedValue(mockOrder)
    mockOrderRepo.updateStatus.mockResolvedValue(true)

    // Act
    await orderService.markDelivered('ord-123')

    // Assert
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('ord-123', 'DELIVERED')
  })

  it('5. Estados inválidos son rechazados en la máquina de estados', async () => {
    // Arrange
    const mockDraftOrder = {
      id: 'ord-draft',
      status: 'DRAFT',
      locationId: 'loc-1',
    }
    mockOrderRepo.findByIdWithItems.mockResolvedValue(mockDraftOrder)

    // Act & Assert (DRAFT to PREPARING should fail)
    await expect(orderService.startPreparing('ord-draft')).rejects.toThrow(ConflictError)

    // Act & Assert (DRAFT to DELIVERED/COMPLETED should fail)
    await expect(orderService.markDelivered('ord-draft')).rejects.toThrow(ConflictError)
  })

  it('6. Pedido sin pago (DRAFT) no debe aparecer en la cola de cocina', async () => {
    // Arrange
    // In our repository implementation, only CONFIRMED, PREPARING, and READY are retrieved.
    // We mock that findKitchenQueue returns empty if no paid orders exist.
    mockOrderRepo.findKitchenQueue.mockResolvedValue([])

    // Act
    const queue = await kitchenService.getActiveTickets('loc-1')

    // Assert
    expect(queue.length).toBe(0)
  })
})
