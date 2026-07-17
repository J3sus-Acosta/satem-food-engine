import 'server-only'

import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors'
import type { IOrderRepository, ICatalogRepository } from '@/repositories'
import type {
  Order,
  OrderWithItems,
  OrderFilters,
  AddOrderItemInput,
  OrderType,
  MenuItemWithProduct,
  Modifier,
} from '@/types'

/**
 * Service coordinating order lifecycle and transitions.
 *
 * Responsibilities:
 * - Order state transitions (Draft -> Pending -> Confirmed -> Preparing -> Ready -> Delivered).
 * - Enforcing snapshot pattern rules when adding items.
 * - Coordinating with KitchenService when an order is confirmed.
 */
export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly catalogRepo: ICatalogRepository
  ) {}

  /**
   * Retrieves an order with all items and modifiers.
   */
  async getOrder(id: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(id)
    if (!order) {
      throw new NotFoundError('Order', id)
    }
    return order
  }

  /**
   * Lists orders for a specific location.
   */
  async listOrders(locationId: string, filters?: OrderFilters): Promise<Order[]> {
    return this.orderRepo.findByLocationId(locationId, filters)
  }

  /**
   * Starts a new order draft for a customer/channel.
   */
  async createDraftOrder(
    locationId: string,
    channelId: string,
    customerId?: string,
    type?: OrderType,
    tableIdentifier?: string,
    notes?: string,
    metadata?: Record<string, unknown>
  ): Promise<Order> {
    // Basic verification of location could go here if needed
    return this.orderRepo.create({
      locationId,
      channelId,
      customerId,
      type,
      tableIdentifier,
      notes,
      metadata,
    })
  }

  /**
   * Adds an item to a draft order.
   * Resolves prices and names for the immutable snapshot.
   */
  async addItem(orderId: string, input: AddOrderItemInput): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // Business Rule: Only draft orders can be modified
    if (order.status !== 'DRAFT') {
      throw new ConflictError(
        `Cannot modify order in status "${order.status}". Only DRAFT orders are editable.`
      )
    }

    // Retrieve active menu to validate and resolve item price/name snapshots
    const menu = await this.catalogRepo.findMenuByLocationId(order.locationId)
    if (!menu) {
      throw new ValidationError(`No active menu found for location "${order.locationId}"`)
    }

    // Find the MenuItem in the menu tree
    let foundMenuItem: MenuItemWithProduct | null = null
    for (const cat of menu.categories) {
      const match = cat.items.find((i) => i.id === input.menuItemId)
      if (match) {
        foundMenuItem = match
        break
      }
    }

    if (!foundMenuItem) {
      throw new ValidationError(
        `MenuItem "${input.menuItemId}" is not available in the current menu for this location.`
      )
    }

    // Business Rule: Products not available cannot be sold
    if (!foundMenuItem.isAvailable || !foundMenuItem.isVisible) {
      throw new ValidationError(
        `MenuItem "${foundMenuItem.name || 'unnamed'}" is currently unavailable or hidden.`
      )
    }

    // Verify Variant ID mismatch
    if (foundMenuItem.productVariantId !== input.productVariantId) {
      throw new ValidationError(
        `Variant ID mismatch. Menu item targets variant "${foundMenuItem.productVariantId}" but got "${input.productVariantId}".`
      )
    }

    // Resolve details
    const resolvedName =
      foundMenuItem.name || foundMenuItem.productVariant?.product?.name || 'Producto Sin Nombre'
    const resolvedUnitPrice = Number(foundMenuItem.price)

    // Resolve Modifiers and Validate selection constraints
    const resolvedModifiers: Array<{ modifierId: string; name: string; priceExtra: number }> = []

    // Map input modifiers to validated modifiers with snapshots
    const inputModifiers = input.modifiers || []

    for (const itemMod of inputModifiers) {
      // Find the modifier in the allowed modifier groups of the product
      let foundModifier: Modifier | null = null

      const modifierGroups = foundMenuItem.modifierGroups || []
      for (const group of modifierGroups) {
        const mod = group.modifiers.find((m) => m.id === itemMod.modifierId)
        if (mod) {
          foundModifier = mod
          break
        }
      }

      if (!foundModifier) {
        throw new ValidationError(
          `Modifier "${itemMod.modifierId}" is not allowed for this product.`
        )
      }

      resolvedModifiers.push({
        modifierId: foundModifier.id,
        name: foundModifier.name,
        priceExtra: Number(foundModifier.priceExtra),
      })
    }

    // Optional: Validate minSelect / maxSelect per modifier group
    const modifierGroups = foundMenuItem.modifierGroups || []
    for (const group of modifierGroups) {
      const selectedInGroup = resolvedModifiers.filter((rm) =>
        group.modifiers.some((m) => m.id === rm.modifierId)
      )

      if (group.isRequired && selectedInGroup.length < (group.minSelect || 1)) {
        throw new ValidationError(
          `Modifier group "${group.name}" requires at least ${group.minSelect || 1} selection(s), but got ${selectedInGroup.length}.`
        )
      }

      if (group.maxSelect !== null && selectedInGroup.length > group.maxSelect) {
        throw new ValidationError(
          `Modifier group "${group.name}" allows at most ${group.maxSelect} selection(s), but got ${selectedInGroup.length}.`
        )
      }
    }

    // Calculate snapshot totals
    const sumModifiersExtra = resolvedModifiers.reduce((sum, m) => sum + m.priceExtra, 0)
    const subtotal = (resolvedUnitPrice + sumModifiersExtra) * input.quantity

    // Commit item addition to database repository
    await this.orderRepo.addItem(orderId, {
      menuItemId: input.menuItemId,
      productVariantId: input.productVariantId,
      quantity: input.quantity,
      notes: input.notes,
      name: resolvedName,
      unitPrice: resolvedUnitPrice,
      subtotal,
      modifiers: resolvedModifiers,
    })

    // Return the updated order with all items
    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Removes an item from a draft order.
   */
  async removeItem(orderId: string, itemId: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // Business Rule: Only draft orders can be modified
    if (order.status !== 'DRAFT') {
      throw new ConflictError(
        `Cannot modify order in status "${order.status}". Only DRAFT orders are editable.`
      )
    }

    const itemExists = order.items.some((i) => i.id === itemId)
    if (!itemExists) {
      throw new NotFoundError('OrderItem', itemId)
    }

    await this.orderRepo.removeItem(orderId, itemId)

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Confirms a pending order and routes it to the kitchen.
   */
  async confirmOrder(orderId: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    // Transition constraints: Order must be DRAFT or PENDING
    if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
      throw new ConflictError(
        `Cannot confirm order in status "${order.status}". Must be DRAFT or PENDING.`
      )
    }

    // Business Rule: Cannot confirm an empty order
    if (order.items.length === 0) {
      throw new ValidationError(
        'Cannot confirm an empty order. Please add items to the order first.'
      )
    }

    // Disparar conceptualmente: OrderCreatedEvent / OrderPaidEvent
    console.log(
      `[Domain Event (Concept)] Discharging OrderPaidEvent / OrderCreatedEvent for order ${order.id}`
    )

    await this.orderRepo.updateStatus(orderId, 'CONFIRMED')

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Marks an order as starting preparation.
   */
  async startPreparing(orderId: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    if (order.status !== 'CONFIRMED') {
      throw new ConflictError(
        `Cannot start preparation for order in status "${order.status}". Must be CONFIRMED.`
      )
    }

    await this.orderRepo.updateStatus(orderId, 'PREPARING')

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Marks an order as ready for pickup/delivery.
   */
  async markReady(orderId: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PREPARING') {
      throw new ConflictError(
        `Cannot mark order as ready from status "${order.status}". Must be CONFIRMED or PREPARING.`
      )
    }

    // Disparar conceptualmente: OrderReadyEvent
    console.log(`[Domain Event (Concept)] Discharging OrderReadyEvent for order ${order.id}`)

    await this.orderRepo.updateStatus(orderId, 'READY')

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Marks an order as delivered/closed.
   */
  async markDelivered(orderId: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    if (order.status !== 'READY') {
      throw new ConflictError(
        `Cannot mark order as delivered from status "${order.status}". Must be READY.`
      )
    }

    await this.orderRepo.updateStatus(orderId, 'DELIVERED')

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }

  /**
   * Cancels an order and releases any reserved resources.
   */
  async cancelOrder(orderId: string, reason: string): Promise<OrderWithItems> {
    const order = await this.orderRepo.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundError('Order', orderId)
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new ConflictError(`Cannot cancel order in status "${order.status}".`)
    }

    // Disparar conceptualmente: OrderCancelledEvent
    console.log(
      `[Domain Event (Concept)] Discharging OrderCancelledEvent for order ${order.id}. Reason: ${reason}`
    )

    await this.orderRepo.updateStatus(orderId, 'CANCELLED', { cancellationReason: reason })

    const updatedOrder = await this.orderRepo.findByIdWithItems(orderId)
    if (!updatedOrder) throw new NotFoundError('Order', orderId)
    return updatedOrder
  }
}

// Instantiate and export service singletons
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { PrismaCatalogRepository } from '@/repositories/prisma/PrismaCatalogRepository'

const orderRepo = new PrismaOrderRepository()
const catalogRepo = new PrismaCatalogRepository()
export const orderService = new OrderService(orderRepo, catalogRepo)
