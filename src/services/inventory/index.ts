import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { IInventoryRepository } from '@/repositories'
import type {
  InventoryItemWithIngredient,
  StockMovement,
  Quantity,
  StockMovementType,
} from '@/types'

/**
 * Service managing product ingredients, stocks, and movements.
 *
 * Responsibilities:
 * - Tracking current stock per location.
 * - Deducting stock on order completion (future recipe integration).
 * - Triggering alerts on low stock levels.
 */
export class InventoryService {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  /**
   * Adjusts stock level manually (e.g. audit or loss).
   */
  async adjustStock(
    inventoryItemId: string,
    quantity: Quantity,
    type: StockMovementType,
    userId: string,
    reason?: string
  ): Promise<StockMovement> {
    throw new NotImplementedError('InventoryService.adjustStock')
  }

  /**
   * Registers stock reduction automatically when an order is completed.
   * Resolves recipes to deduct constituent ingredients.
   */
  async processOrderSales(orderId: string): Promise<StockMovement[]> {
    throw new NotImplementedError('InventoryService.processOrderSales')
  }

  /**
   * Lists inventory items running low at a location.
   */
  async getLowStockAlerts(locationId: string): Promise<InventoryItemWithIngredient[]> {
    throw new NotImplementedError('InventoryService.getLowStockAlerts')
  }
}
