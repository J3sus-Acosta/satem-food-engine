/**
 * Prisma implementation of IOrderRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { IOrderRepository } from '@/repositories/interfaces'
import type {
  Order,
  OrderWithItems,
  OrderStatus,
  CreateOrderInput,
  AddOrderItemInput,
  OrderFilters,
} from '@/types'

/**
 * Prisma-backed implementation of the Order repository.
 *
 * Responsibilities:
 * - Map Prisma `Decimal` money fields to `Money` (number).
 * - Generate sequential order numbers atomically (e.g., via DB sequence or max+1 tx).
 * - Apply soft-delete filters (`deletedAt: null`) on all queries.
 * - Wrap multi-step mutations in `db.$transaction`.
 */
export class PrismaOrderRepository implements IOrderRepository {
  async findById(_id: string): Promise<Order | null> {
    throw new NotImplementedError('PrismaOrderRepository.findById')
  }

  async findByIdWithItems(_id: string): Promise<OrderWithItems | null> {
    throw new NotImplementedError('PrismaOrderRepository.findByIdWithItems')
  }

  async findByOrderNumber(_locationId: string, _orderNumber: string): Promise<Order | null> {
    throw new NotImplementedError('PrismaOrderRepository.findByOrderNumber')
  }

  async findByLocationId(_locationId: string, _filters?: OrderFilters): Promise<Order[]> {
    throw new NotImplementedError('PrismaOrderRepository.findByLocationId')
  }

  async countByLocationId(_locationId: string, _filters?: OrderFilters): Promise<number> {
    throw new NotImplementedError('PrismaOrderRepository.countByLocationId')
  }

  async findByCustomerId(_customerId: string, _options?: { limit?: number }): Promise<Order[]> {
    throw new NotImplementedError('PrismaOrderRepository.findByCustomerId')
  }

  async create(_data: CreateOrderInput): Promise<Order> {
    throw new NotImplementedError('PrismaOrderRepository.create')
  }

  async addItem(
    _orderId: string,
    _item: AddOrderItemInput & { name: string; unitPrice: number; subtotal: number }
  ): Promise<Order> {
    throw new NotImplementedError('PrismaOrderRepository.addItem')
  }

  async removeItem(_orderId: string, _itemId: string): Promise<Order> {
    throw new NotImplementedError('PrismaOrderRepository.removeItem')
  }

  async updateStatus(
    _id: string,
    _status: OrderStatus,
    _extra?: { cancellationReason?: string }
  ): Promise<Order> {
    throw new NotImplementedError('PrismaOrderRepository.updateStatus')
  }

  async linkCustomer(_orderId: string, _customerId: string): Promise<Order> {
    throw new NotImplementedError('PrismaOrderRepository.linkCustomer')
  }

  async softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('PrismaOrderRepository.softDelete')
  }

  async nextOrderNumber(_locationId: string): Promise<string> {
    throw new NotImplementedError('PrismaOrderRepository.nextOrderNumber')
  }
}
