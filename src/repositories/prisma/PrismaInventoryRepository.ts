/**
 * Prisma implementation of IInventoryRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 * Phase note: schema is ready but services/inventory is not yet active.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { IInventoryRepository } from '@/repositories/interfaces'
import type {
  Ingredient,
  InventoryItem,
  InventoryItemWithIngredient,
  StockMovement,
  CreateStockMovementInput,
  PaginationParams,
} from '@/types'

/**
 * Prisma-backed implementation of the Inventory repository.
 *
 * Responsibilities:
 * - All quantity fields use Decimal(10,3) in DB; map to `Quantity` (number).
 * - recordMovement must be atomic: update quantity + insert movement in one tx.
 */
export class PrismaInventoryRepository implements IInventoryRepository {
  async findIngredientById(_id: string): Promise<Ingredient | null> {
    throw new NotImplementedError('PrismaInventoryRepository.findIngredientById')
  }

  async findIngredientsByOrganizationId(
    _organizationId: string,
    _options?: PaginationParams
  ): Promise<Ingredient[]> {
    throw new NotImplementedError('PrismaInventoryRepository.findIngredientsByOrganizationId')
  }

  async findItemByLocationAndIngredient(
    _locationId: string,
    _ingredientId: string
  ): Promise<InventoryItem | null> {
    throw new NotImplementedError('PrismaInventoryRepository.findItemByLocationAndIngredient')
  }

  async findItemsByLocationId(_locationId: string): Promise<InventoryItemWithIngredient[]> {
    throw new NotImplementedError('PrismaInventoryRepository.findItemsByLocationId')
  }

  async findLowStockByLocationId(_locationId: string): Promise<InventoryItemWithIngredient[]> {
    throw new NotImplementedError('PrismaInventoryRepository.findLowStockByLocationId')
  }

  async recordMovement(_data: CreateStockMovementInput): Promise<StockMovement> {
    throw new NotImplementedError('PrismaInventoryRepository.recordMovement')
  }

  async findMovementsByItemId(
    _inventoryItemId: string,
    _options?: PaginationParams
  ): Promise<StockMovement[]> {
    throw new NotImplementedError('PrismaInventoryRepository.findMovementsByItemId')
  }

  async findMovementsByOrderId(_orderId: string): Promise<StockMovement[]> {
    throw new NotImplementedError('PrismaInventoryRepository.findMovementsByOrderId')
  }
}
