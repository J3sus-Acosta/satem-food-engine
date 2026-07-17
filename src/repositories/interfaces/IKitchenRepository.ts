import type { KitchenTicket, KitchenTicketWithItems, KitchenTicketStatus } from '@/types'

/**
 * Repository contract for the KitchenTicket aggregate.
 *
 * Phase 2 note: tickets are scoped to an order (single prep point).
 * Phase 3 will add KitchenStation support without breaking this interface
 * (a new optional field will be added to the create input).
 */
export interface IKitchenRepository {
  /**
   * Find a kitchen ticket by its unique identifier.
   * Returns null if not found.
   */
  findById(id: string): Promise<KitchenTicket | null>

  /**
   * Find a ticket with all its items.
   * Returns null if not found.
   */
  findByIdWithItems(id: string): Promise<KitchenTicketWithItems | null>

  /**
   * Find the kitchen ticket(s) generated for a given order.
   * Phase 2: returns at most one ticket per order.
   */
  findByOrderId(orderId: string): Promise<KitchenTicket[]>

  /**
   * List all tickets for a location that are pending or in-progress.
   * Used by the kitchen display to show the current queue.
   */
  findActiveByLocationId(locationId: string): Promise<KitchenTicketWithItems[]>

  /**
   * Create a kitchen ticket for an order.
   * The adapter is responsible for populating KitchenTicketItems from
   * the order's items atomically.
   */
  createForOrder(orderId: string): Promise<KitchenTicketWithItems>

  /**
   * Update the status of a kitchen ticket.
   * Timestamps (startedAt, completedAt) are set by the adapter.
   */
  updateStatus(id: string, status: KitchenTicketStatus): Promise<KitchenTicket>

  /**
   * Mark a ticket as printed (set printedAt timestamp).
   */
  markPrinted(id: string): Promise<KitchenTicket>
}
