import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { IOrderRepository } from '@/repositories'
import type { Order, OrderWithItems, OrderFilters, AddOrderItemInput, OrderType } from '@/types'

/**
 * Service coordinating order lifecycle and transitions.
 *
 * Responsibilities:
 * - Order state transitions (Draft -> Pending -> Confirmed -> Preparing -> Ready -> Delivered).
 * - Enforcing snapshot pattern rules when adding items.
 * - Coordinating with KitchenService when an order is confirmed.
 */
export class OrderService {
  constructor(private readonly orderRepo: IOrderRepository) {}

  /**
   * Retrieves an order with all items and modifiers.
   */
  async getOrder(id: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.getOrder')
  }

  /**
   * Lists orders for a specific location.
   */
  async listOrders(locationId: string, filters?: OrderFilters): Promise<Order[]> {
    throw new NotImplementedError('OrderService.listOrders')
  }

  /**
   * Starts a new order draft for a customer/channel.
   */
  async createDraftOrder(
    locationId: string,
    channelId: string,
    customerId?: string,
    type?: OrderType
  ): Promise<Order> {
    throw new NotImplementedError('OrderService.createDraftOrder')
  }

  /**
   * Adds an item to a draft order.
   * Resolves prices and names for the immutable snapshot.
   */
  async addItem(orderId: string, input: AddOrderItemInput): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.addItem')
  }

  /**
   * Removes an item from a draft order.
   */
  async removeItem(orderId: string, itemId: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.removeItem')
  }

  /**
   * Confirms a pending order and routes it to the kitchen.
   */
  async confirmOrder(orderId: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.confirmOrder')
  }

  /**
   * Marks an order as ready for pickup/delivery.
   */
  async markReady(orderId: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.markReady')
  }

  /**
   * Marks an order as delivered/closed.
   */
  async markDelivered(orderId: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.markDelivered')
  }

  /**
   * Cancels an order and releases any reserved resources.
   */
  async cancelOrder(orderId: string, reason: string): Promise<OrderWithItems> {
    throw new NotImplementedError('OrderService.cancelOrder')
  }
}
