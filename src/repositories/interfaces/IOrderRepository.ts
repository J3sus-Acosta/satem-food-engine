import type {
  Order,
  OrderWithItems,
  CreateOrderInput,
  AddOrderItemInput,
  OrderFilters,
  OrderStatus,
} from '@/types'

/**
 * Repository contract for the Order aggregate.
 *
 * Rules:
 * - All methods return domain types, NOT Prisma types.
 * - Soft-deleted orders are excluded unless stated otherwise.
 * - Price snapshot logic belongs in the service layer, not here.
 * - All mutations that touch OrderItem must be transactional in the adapter.
 */
export interface IOrderRepository {
  /**
   * Find an order by its unique identifier (without items).
   * Returns null if not found or soft-deleted.
   */
  findById(id: string): Promise<Order | null>

  /**
   * Find an order with all its items and modifiers.
   * Returns null if not found or soft-deleted.
   */
  findByIdWithItems(id: string): Promise<OrderWithItems | null>

  /**
   * Find an order by its human-readable order number within a location.
   */
  findByOrderNumber(locationId: string, orderNumber: string): Promise<Order | null>

  /**
   * List orders for a location with optional filters and pagination.
   */
  findByLocationId(locationId: string, filters?: OrderFilters): Promise<Order[]>

  /**
   * Count orders for a location matching the given filters.
   */
  countByLocationId(locationId: string, filters?: OrderFilters): Promise<number>

  /**
   * List orders by customer across all locations of an organization.
   */
  findByCustomerId(customerId: string, options?: { limit?: number }): Promise<Order[]>

  /**
   * Create a new draft order (empty, no items yet).
   * Returns the persisted order.
   */
  create(data: CreateOrderInput): Promise<Order>

  /**
   * Append an item to an existing draft order.
   * The repository is responsible for generating the snapshot values.
   * The service layer must resolve name and price BEFORE calling this method.
   */
  addItem(
    orderId: string,
    item: AddOrderItemInput & {
      /** Resolved snapshot name from MenuItem/Product. */
      name: string
      /** Resolved snapshot price from MenuItem. */
      unitPrice: number
      subtotal: number
    }
  ): Promise<Order>

  /**
   * Remove an item from a draft order.
   */
  removeItem(orderId: string, itemId: string): Promise<Order>

  /**
   * Update the status of an order.
   * Timestamps (confirmedAt, cancelledAt, etc.) are set by the adapter
   * based on the transition.
   */
  updateStatus(
    id: string,
    status: OrderStatus,
    extra?: { cancellationReason?: string }
  ): Promise<Order>

  /**
   * Link a customer to an order (used for guest checkout retroactive linking).
   */
  linkCustomer(orderId: string, customerId: string): Promise<Order>

  /**
   * Soft-delete an order.
   */
  softDelete(id: string): Promise<void>

  /**
   * Get the next sequential order number for a location.
   * Must be atomic to avoid duplicates under concurrent requests.
   */
  nextOrderNumber(locationId: string): Promise<string>
}
