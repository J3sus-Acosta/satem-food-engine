/**
 * Prisma implementation of IKitchenRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { IKitchenRepository } from '@/repositories/interfaces'
import type { KitchenTicket, KitchenTicketWithItems, KitchenTicketStatus } from '@/types'

/**
 * Prisma-backed implementation of the Kitchen repository.
 *
 * Phase 2: single ticket per order.
 * Phase 3 extension: add optional kitchenStationId parameter to createForOrder.
 */
export class PrismaKitchenRepository implements IKitchenRepository {
  async findById(_id: string): Promise<KitchenTicket | null> {
    throw new NotImplementedError('PrismaKitchenRepository.findById')
  }

  async findByIdWithItems(_id: string): Promise<KitchenTicketWithItems | null> {
    throw new NotImplementedError('PrismaKitchenRepository.findByIdWithItems')
  }

  async findByOrderId(_orderId: string): Promise<KitchenTicket[]> {
    throw new NotImplementedError('PrismaKitchenRepository.findByOrderId')
  }

  async findActiveByLocationId(_locationId: string): Promise<KitchenTicketWithItems[]> {
    throw new NotImplementedError('PrismaKitchenRepository.findActiveByLocationId')
  }

  async createForOrder(_orderId: string): Promise<KitchenTicketWithItems> {
    throw new NotImplementedError('PrismaKitchenRepository.createForOrder')
  }

  async updateStatus(_id: string, _status: KitchenTicketStatus): Promise<KitchenTicket> {
    throw new NotImplementedError('PrismaKitchenRepository.updateStatus')
  }

  async markPrinted(_id: string): Promise<KitchenTicket> {
    throw new NotImplementedError('PrismaKitchenRepository.markPrinted')
  }
}
