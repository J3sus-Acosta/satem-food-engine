/**
 * Prisma implementation of IOrderRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

import { db } from '@/server/db'
import { Prisma } from '@/generated/prisma'
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  OrderItemModifier as PrismaOrderItemModifier,
} from '@/generated/prisma'
import type { IOrderRepository } from '@/repositories/interfaces'
import type {
  Order,
  OrderWithItems,
  OrderStatus,
  OrderType,
  CreateOrderInput,
  AddOrderItemInput,
  OrderFilters,
  OrderItem,
  OrderItemModifier,
} from '@/types'

// In-Memory state for local development when PostgreSQL is not running
const IN_MEMORY_ORDERS: OrderWithItems[] = []
let IN_MEMORY_COUNTER = 0

function isConnectionError(error: unknown): boolean {
  if (!error) return false
  const err = error as Record<string, unknown> | null | undefined
  const msg = String(err?.message || '')
  return (
    err?.code === 'P1001' ||
    err?.code === 'P1002' ||
    err?.code === 'P1003' ||
    err?.code === 'P1017' ||
    msg.includes("Can't reach database") ||
    msg.includes('connect ECONNREFUSED') ||
    err?.name === 'PrismaClientInitializationError'
  )
}

function mapPrismaOrderToDomain(order: PrismaOrder): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    locationId: order.locationId,
    customerId: order.customerId,
    channelId: order.channelId,
    status: order.status as OrderStatus,
    type: order.type as OrderType,
    tableIdentifier: order.tableIdentifier,
    notes: order.notes,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    confirmedAt: order.confirmedAt,
    preparedAt: order.preparedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    metadata: order.metadata as unknown as Record<string, unknown> | null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deletedAt: order.deletedAt,
  }
}

function mapPrismaOrderWithItemsToDomain(
  order: PrismaOrder & {
    items?: (PrismaOrderItem & {
      modifiers?: PrismaOrderItemModifier[]
    })[]
  }
): OrderWithItems {
  const domainOrder = mapPrismaOrderToDomain(order)
  const items = (order.items || []).map((item) => ({
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    productVariantId: item.productVariantId,
    name: item.name,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    subtotal: Number(item.subtotal),
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
    modifiers: (item.modifiers || []).map((mod) => ({
      id: mod.id,
      orderItemId: mod.orderItemId,
      modifierId: mod.modifierId,
      name: mod.name,
      priceExtra: Number(mod.priceExtra),
      createdAt: mod.createdAt,
    })),
  }))

  return {
    ...domainOrder,
    items,
  }
}

export class PrismaOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | null> {
    try {
      const order = await db.order.findFirst({
        where: { id, deletedAt: null },
      })
      return order ? mapPrismaOrderToDomain(order) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findById] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === id && o.deletedAt === null)
        return found || null
      }
      throw error
    }
  }

  async findByIdWithItems(id: string): Promise<OrderWithItems | null> {
    try {
      const order = await db.order.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: {
            where: { deletedAt: null },
            include: {
              modifiers: true,
            },
          },
        },
      })
      return order ? mapPrismaOrderWithItemsToDomain(order) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findByIdWithItems] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === id && o.deletedAt === null)
        return found || null
      }
      throw error
    }
  }

  async findByOrderNumber(locationId: string, orderNumber: string): Promise<Order | null> {
    try {
      const order = await db.order.findFirst({
        where: { locationId, orderNumber, deletedAt: null },
      })
      return order ? mapPrismaOrderToDomain(order) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findByOrderNumber] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find(
          (o) =>
            o.locationId === locationId && o.orderNumber === orderNumber && o.deletedAt === null
        )
        return found || null
      }
      throw error
    }
  }

  async findByLocationId(locationId: string, filters?: OrderFilters): Promise<Order[]> {
    try {
      const where: Prisma.OrderWhereInput = { locationId, deletedAt: null }
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status }
        } else {
          where.status = filters.status
        }
      }
      if (filters?.type) {
        where.type = filters.type
      }
      if (filters?.channelId) {
        where.channelId = filters.channelId
      }
      if (filters?.customerId) {
        where.customerId = filters.customerId
      }

      const orders = await db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit,
        skip: filters?.page && filters?.limit ? (filters.page - 1) * filters.limit : undefined,
      })

      return orders.map(mapPrismaOrderToDomain)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findByLocationId] DB connection failed, using in-memory store.'
        )
        let result = IN_MEMORY_ORDERS.filter(
          (o) => o.locationId === locationId && o.deletedAt === null
        )
        if (filters?.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
          result = result.filter((o) => statuses.includes(o.status))
        }
        if (filters?.type) {
          result = result.filter((o) => o.type === filters.type)
        }
        if (filters?.channelId) {
          result = result.filter((o) => o.channelId === filters.channelId)
        }
        if (filters?.customerId) {
          result = result.filter((o) => o.customerId === filters.customerId)
        }
        const page = filters?.page || 1
        const limit = filters?.limit || 100
        const start = (page - 1) * limit
        return result.slice(start, start + limit)
      }
      throw error
    }
  }

  async countByLocationId(locationId: string, filters?: OrderFilters): Promise<number> {
    try {
      const where: Prisma.OrderWhereInput = { locationId, deletedAt: null }
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status }
        } else {
          where.status = filters.status
        }
      }
      return await db.order.count({ where })
    } catch (error) {
      if (isConnectionError(error)) {
        let result = IN_MEMORY_ORDERS.filter(
          (o) => o.locationId === locationId && o.deletedAt === null
        )
        if (filters?.status) {
          const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
          result = result.filter((o) => statuses.includes(o.status))
        }
        return result.length
      }
      throw error
    }
  }

  async findByCustomerId(customerId: string, options?: { limit?: number }): Promise<Order[]> {
    try {
      const orders = await db.order.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
      })
      return orders.map(mapPrismaOrderToDomain)
    } catch (error) {
      if (isConnectionError(error)) {
        const result = IN_MEMORY_ORDERS.filter(
          (o) => o.customerId === customerId && o.deletedAt === null
        )
        return result.slice(0, options?.limit || 100)
      }
      throw error
    }
  }

  async create(data: CreateOrderInput): Promise<Order> {
    // ── Atomic order creation with retry on unique constraint collision ────────
    //
    // Problem: Reading the last order number and inserting a new one are two
    // separate operations. Under concurrent load two requests could read the
    // same "last" number and both attempt to insert, causing a P2002 (unique
    // constraint violation on locationId + orderNumber).
    //
    // Fix: Wrap both operations in a db.$transaction so that PostgreSQL
    // serialises the read + write. If a concurrent write still sneaks in and
    // causes a P2002, we retry with the freshly computed next number.
    const MAX_RETRIES = 5

    const tryCreate = async (): Promise<Order> => {
      // Calculate the next order number INSIDE the transaction so the read
      // and the write are atomic at the database level.
      return db.$transaction(async (tx) => {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const latestOrder = await tx.order.findFirst({
          where: { locationId: data.locationId, createdAt: { gte: todayStart } },
          orderBy: { orderNumber: 'desc' },
          select: { orderNumber: true },
        })

        let orderNumber = '#001'
        if (latestOrder) {
          const lastNumStr = latestOrder.orderNumber.replace('#', '')
          const lastNum = parseInt(lastNumStr, 10)
          if (!isNaN(lastNum)) {
            orderNumber = `#${String(lastNum + 1).padStart(3, '0')}`
          }
        }

        const order = await tx.order.create({
          data: {
            orderNumber,
            locationId: data.locationId,
            channelId: data.channelId,
            customerId: data.customerId || null,
            type: data.type || 'DINE_IN',
            tableIdentifier: data.tableIdentifier || null,
            notes: data.notes || null,
            metadata: (data.metadata || {}) as Prisma.InputJsonValue,
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
          },
        })
        return mapPrismaOrderToDomain(order)
      })
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await tryCreate()
      } catch (error) {
        const prismaError = error as { code?: string }
        if (prismaError?.code === 'P2002' && attempt < MAX_RETRIES) {
          // Unique constraint collision on orderNumber — retry immediately
          // (the next iteration reads the freshly inserted order number)
          continue
        }
        if (isConnectionError(error)) {
          // Fallback to in-memory store when PostgreSQL is unavailable
          console.warn(
            '[PrismaOrderRepository.create] DB connection failed, using in-memory store.'
          )
          IN_MEMORY_COUNTER++
          const orderNumber = `#${String(IN_MEMORY_COUNTER).padStart(3, '0')}`
          const newOrder: OrderWithItems = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            orderNumber,
            locationId: data.locationId,
            customerId: data.customerId || null,
            channelId: data.channelId,
            status: 'DRAFT' as OrderStatus,
            type: (data.type || 'DINE_IN') as OrderType,
            tableIdentifier: data.tableIdentifier || null,
            notes: data.notes || null,
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
            metadata: data.metadata || null,
            cancellationReason: null,
            confirmedAt: null,
            preparedAt: null,
            deliveredAt: null,
            cancelledAt: null,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [],
          }
          IN_MEMORY_ORDERS.push(newOrder)
          return newOrder
        }
        throw error
      }
    }

    // Exhausted retries — this should be extremely rare in practice
    throw new Error(
      `[PrismaOrderRepository.create] Failed to generate a unique order number for location "${data.locationId}" after ${MAX_RETRIES} attempts.`
    )
  }

  async addItem(
    orderId: string,
    item: AddOrderItemInput & { name: string; unitPrice: number; subtotal: number }
  ): Promise<Order> {
    try {
      await db.$transaction(async (tx) => {
        // Create the order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId,
            menuItemId: item.menuItemId,
            productVariantId: item.productVariantId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            notes: item.notes || null,
          },
        })

        // Create modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          await tx.orderItemModifier.createMany({
            data: item.modifiers.map((m) => ({
              orderItemId: orderItem.id,
              modifierId: m.modifierId,
              name: m.name,
              priceExtra: m.priceExtra,
            })),
          })
        }

        // Recalculate totals
        const allItems = await tx.orderItem.findMany({
          where: { orderId, deletedAt: null },
        })

        const subtotal = allItems.reduce((sum, i) => sum + Number(i.subtotal), 0)
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal,
            totalAmount: subtotal, // tax and discount default to 0
          },
        })
      })

      const updated = await this.findById(orderId)
      if (!updated) throw new Error(`Failed to retrieve updated order ${orderId}`)
      return updated
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn('[PrismaOrderRepository.addItem] DB connection failed, using in-memory store.')
        const found = IN_MEMORY_ORDERS.find((o) => o.id === orderId && o.deletedAt === null)
        if (!found) throw new Error(`Order ${orderId} not found in-memory`)

        const newItemId = `mem_item_${Date.now()}`
        const newModifiers: OrderItemModifier[] = (item.modifiers || []).map((m, idx) => ({
          id: `mem_mod_${Date.now()}_${idx}`,
          orderItemId: newItemId,
          modifierId: m.modifierId,
          name: m.name,
          priceExtra: m.priceExtra,
          createdAt: new Date(),
        }))

        const newOrderItem: OrderItem & { modifiers: OrderItemModifier[] } = {
          id: newItemId,
          orderId,
          menuItemId: item.menuItemId,
          productVariantId: item.productVariantId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          notes: item.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          modifiers: newModifiers,
        }

        found.items.push(newOrderItem)
        found.subtotal = found.items.reduce((sum, i) => sum + i.subtotal, 0)
        found.totalAmount = found.subtotal
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    try {
      await db.$transaction(async (tx) => {
        // Delete modifiers and then the item (in Prisma, if cascades are configured, or do manually)
        await tx.orderItemModifier.deleteMany({
          where: { orderItemId: itemId },
        })
        await tx.orderItem.delete({
          where: { id: itemId },
        })

        // Recalculate totals
        const allItems = await tx.orderItem.findMany({
          where: { orderId, deletedAt: null },
        })

        const subtotal = allItems.reduce((sum, i) => sum + Number(i.subtotal), 0)
        await tx.order.update({
          where: { id: orderId },
          data: {
            subtotal,
            totalAmount: subtotal,
          },
        })
      })

      const updated = await this.findById(orderId)
      if (!updated) throw new Error(`Failed to retrieve updated order ${orderId}`)
      return updated
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.removeItem] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === orderId && o.deletedAt === null)
        if (!found) throw new Error(`Order ${orderId} not found in-memory`)

        found.items = found.items.filter((i) => i.id !== itemId)
        found.subtotal = found.items.reduce((sum, i) => sum + i.subtotal, 0)
        found.totalAmount = found.subtotal
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    extra?: { cancellationReason?: string }
  ): Promise<Order> {
    try {
      const data: Prisma.OrderUpdateInput = { status }
      const now = new Date()

      if (status === 'CONFIRMED') data.confirmedAt = now
      if (status === 'PREPARING') data.preparedAt = now
      if (status === 'READY') data.preparedAt = now // fallback or set preparedAt if transitioning to ready
      if (status === 'DELIVERED') data.deliveredAt = now
      if (status === 'CANCELLED') {
        data.cancelledAt = now
        data.cancellationReason = extra?.cancellationReason || 'No especificado'
      }

      const order = await db.order.update({
        where: { id },
        data,
      })
      return mapPrismaOrderToDomain(order)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.updateStatus] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === id && o.deletedAt === null)
        if (!found) throw new Error(`Order ${id} not found in-memory`)

        const now = new Date()
        found.status = status
        found.updatedAt = now

        if (status === 'CONFIRMED') found.confirmedAt = now
        if (status === 'PREPARING') found.preparedAt = now
        if (status === 'DELIVERED') found.deliveredAt = now
        if (status === 'CANCELLED') {
          found.cancelledAt = now
          found.cancellationReason = extra?.cancellationReason || 'No especificado'
        }

        return found
      }
      throw error
    }
  }

  async linkCustomer(orderId: string, customerId: string): Promise<Order> {
    try {
      const order = await db.order.update({
        where: { id: orderId },
        data: { customerId },
      })
      return mapPrismaOrderToDomain(order)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.linkCustomer] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === orderId && o.deletedAt === null)
        if (!found) throw new Error(`Order ${orderId} not found in-memory`)

        found.customerId = customerId
        found.updatedAt = new Date()
        return found
      }
      throw error
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await db.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.softDelete] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_ORDERS.find((o) => o.id === id && o.deletedAt === null)
        if (found) {
          found.deletedAt = new Date()
        }
        return
      }
      throw error
    }
  }

  async nextOrderNumber(locationId: string): Promise<string> {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const latestOrder = await db.order.findFirst({
        where: {
          locationId,
          createdAt: {
            gte: todayStart,
          },
        },
        orderBy: {
          orderNumber: 'desc',
        },
        select: {
          orderNumber: true,
        },
      })

      if (!latestOrder) {
        return '#001'
      }

      const lastNumStr = latestOrder.orderNumber.replace('#', '')
      const lastNum = parseInt(lastNumStr, 10)
      if (isNaN(lastNum)) {
        return '#001'
      }

      const nextNum = lastNum + 1
      return `#${String(nextNum).padStart(3, '0')}`
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.nextOrderNumber] DB connection failed, using in-memory store.'
        )
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const locationOrders = IN_MEMORY_ORDERS.filter(
          (o) => o.locationId === locationId && o.createdAt >= todayStart
        )

        if (locationOrders.length === 0) {
          return '#001'
        }

        // Parse max
        let maxNum = 0
        for (const o of locationOrders) {
          const numStr = o.orderNumber.replace('#', '')
          const num = parseInt(numStr, 10)
          if (!isNaN(num) && num > maxNum) {
            maxNum = num
          }
        }

        const nextNum = maxNum + 1
        return `#${String(nextNum).padStart(3, '0')}`
      }
      throw error
    }
  }

  async findActiveOrdersWithItems(locationId: string): Promise<OrderWithItems[]> {
    try {
      const orders = await db.order.findMany({
        where: {
          locationId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'PREPARING', 'READY'] },
        },
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // FIFO: oldest first
      })
      return orders.map(mapPrismaOrderWithItemsToDomain)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findActiveOrdersWithItems] DB connection failed, using in-memory store.'
        )
        const result = IN_MEMORY_ORDERS.filter(
          (o) =>
            o.locationId === locationId &&
            o.deletedAt === null &&
            ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
        )
        // Sort ascending by createdAt (oldest first)
        return [...result].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      }
      throw error
    }
  }

  async findKitchenQueue(locationId: string): Promise<OrderWithItems[]> {
    return this.findActiveOrdersWithItems(locationId)
  }

  async findDefaultChannelId(locationId: string): Promise<string | null> {
    try {
      const channel = await db.channel.findFirst({
        where: { locationId, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      return channel?.id || null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaOrderRepository.findDefaultChannelId] DB connection failed, using in-memory mock channel.'
        )
        return 'web-channel'
      }
      throw error
    }
  }
}
