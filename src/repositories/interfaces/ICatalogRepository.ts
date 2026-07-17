import type {
  MenuWithCategories,
  Category,
  Product,
  ProductWithFull,
  MenuItem,
  DailyMenuOverride,
} from '@/types'

/**
 * Repository contract for the Catalog (Menus, Categories, MenuItems) read operations.
 *
 * Rules:
 * - Independent of React and Prisma.
 * - Soft-deleted categories/menu items/products are automatically excluded.
 */
export interface ICatalogRepository {
  /**
   * Retrieves the full active menu with all categories, menu items, variants,
   * modifier groups, and modifiers for a specific location.
   */
  findMenuByLocationId(locationId: string): Promise<MenuWithCategories | null>

  /**
   * Retrieves the full active menu using the location slug.
   */
  findMenuByLocationSlug(locationSlug: string): Promise<MenuWithCategories | null>

  /**
   * Retrieves all active categories associated with a menu.
   */
  findCategoriesByMenuId(menuId: string): Promise<Category[]>

  /**
   * Lists all active products in the global catalog of an organization.
   */
  findProductsByOrganizationId(organizationId: string): Promise<Product[]>

  /**
   * Finds a product by its URL-friendly slug with its variants and modifiers.
   */
  findProductBySlug(organizationId: string, slug: string): Promise<ProductWithFull | null>

  /**
   * Finds a MenuItem by the SKU of its ProductVariant for a specific location.
   */
  findMenuItemBySku(locationId: string, sku: string): Promise<MenuItem | null>

  /**
   * Upserts a DailyMenuOverride for a MenuItem.
   */
  upsertDailyMenuOverride(
    menuItemId: string,
    override: {
      price: number | null
      isAvailable: boolean | null
      stockDaily: number | null
      isHighlighted: boolean
      isVisible: boolean | null
      sortOrder: number | null
      notes: string | null
    }
  ): Promise<DailyMenuOverride>

  /**
   * Deletes all DailyMenuOverrides for every MenuItem belonging to the active
   * menu of the given location. Called by the nightly maintenance workflow to
   * reset daily menu state before the next day's sync.
   *
   * @returns The number of overrides deleted.
   */
  resetDailyOverrides(locationId: string): Promise<number>
}
