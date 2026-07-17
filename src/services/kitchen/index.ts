import 'server-only'

import type { IOrderRepository } from '@/repositories'
import type { OrderService } from '../orders'
import type { OrderWithItems } from '@/types'

/**
 * Service managing kitchen ticketing and preparation status.
 *
 * Responsibilities:
 * - Retrieving active orders for the kitchen Kanban display.
 * - Changing order status as preparation begins and finishes.
 */
export class KitchenService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly orderService: OrderService
  ) {}

  /**
   * Retrieves active tickets (orders in CONFIRMED, PREPARING, or READY status) for a location queue.
   */
  async getActiveTickets(locationId: string): Promise<OrderWithItems[]> {
    return this.orderRepo.findActiveOrdersWithItems(locationId)
  }

  /**
   * Marks a kitchen ticket/order as starting preparation.
   */
  async startPreparing(orderId: string): Promise<OrderWithItems> {
    return this.orderService.startPreparing(orderId)
  }

  /**
   * Marks a kitchen ticket/order as ready.
   */
  async markReady(orderId: string): Promise<OrderWithItems> {
    return this.orderService.markReady(orderId)
  }
}

// Instantiate and export service singletons
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { orderService } from '../orders'

const orderRepo = new PrismaOrderRepository()

export const kitchenService = new KitchenService(orderRepo, orderService)
