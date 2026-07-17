import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { IKitchenRepository } from '@/repositories'
import type { KitchenTicket, KitchenTicketWithItems } from '@/types'

/**
 * Service managing kitchen ticketing and preparation status.
 *
 * Responsibilities:
 * - Creating tickets upon order confirmation.
 * - Tracking preparation lifecycle (Pending -> In Progress -> Done).
 * - Future extension: routing to multiple kitchen stations.
 */
export class KitchenService {
  constructor(private readonly kitchenRepo: IKitchenRepository) {}

  /**
   * Retrieves active tickets for a location queue.
   */
  async getActiveQueue(locationId: string): Promise<KitchenTicketWithItems[]> {
    throw new NotImplementedError('KitchenService.getActiveQueue')
  }

  /**
   * Creates a kitchen ticket for a confirmed order.
   */
  async createTicketForOrder(orderId: string): Promise<KitchenTicketWithItems> {
    throw new NotImplementedError('KitchenService.createTicketForOrder')
  }

  /**
   * Marks a kitchen ticket as starting preparation.
   */
  async startPreparation(ticketId: string): Promise<KitchenTicket> {
    throw new NotImplementedError('KitchenService.startPreparation')
  }

  /**
   * Marks a kitchen ticket as completed.
   */
  async completePreparation(ticketId: string): Promise<KitchenTicket> {
    throw new NotImplementedError('KitchenService.completePreparation')
  }

  /**
   * Cancels a kitchen ticket.
   */
  async cancelTicket(ticketId: string): Promise<KitchenTicket> {
    throw new NotImplementedError('KitchenService.cancelTicket')
  }

  /**
   * Simulates/triggers printing for a ticket.
   */
  async printTicket(ticketId: string): Promise<KitchenTicket> {
    throw new NotImplementedError('KitchenService.printTicket')
  }
}
