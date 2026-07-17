import type { MenuWithCategories, Category, Product, ProductWithFull } from '@/types'

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
}
