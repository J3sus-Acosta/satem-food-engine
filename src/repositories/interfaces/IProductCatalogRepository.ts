/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ProductVersion,
  CatalogAuditLog,
  CreateProductInput,
  UpdateProductInput,
  ProductWithFull,
  ProductCatalogListFilters,
  Ingredient,
} from '@/types'

/**
 * Repository interface for managing structural product catalog data.
 * All methods operate on domain models rather than Prisma generated types.
 */
export interface IProductCatalogRepository {
  /**
   * Finds a product by its ID, including variants, modifiers, and ingredients.
   * By default, returns null if soft-deleted, unless includeDeleted is true.
   */
  findById(id: string, includeDeleted?: boolean): Promise<ProductWithFull | null>

  /**
   * Finds a product version by its ID.
   */
  findVersionById(versionId: string): Promise<ProductVersion | null>

  /**
   * Finds the latest version number for a product.
   * Returns 0 if no versions exist.
   */
  getLatestVersionNumber(productId: string): Promise<number>

  /**
   * Lists products with filtering, search, sorting, and pagination.
   */
  findProducts(
    organizationId: string,
    filters: ProductCatalogListFilters,
    page: number,
    limit: number
  ): Promise<{ products: ProductWithFull[]; total: number }>

  /**
   * Checks if a SKU is already in use within an organization.
   * If excludingProductId is provided, checks other products besides that one.
   */
  isSkuUnique(organizationId: string, sku: string, excludingProductId?: string): Promise<boolean>

  /**
   * Checks if a Slug is already in use globally.
   * If excludingProductId is provided, checks other products besides that one.
   */
  isSlugUnique(slug: string, excludingProductId?: string): Promise<boolean>

  /**
   * Creates a product, a default variant, and logs the initial version.
   */
  create(data: CreateProductInput & { defaultCategoryId?: string }): Promise<ProductWithFull>

  /**
   * Updates a product's details and logs the version snapshot.
   */
  update(
    id: string,
    data: UpdateProductInput & {
      defaultCategoryId?: string
      variants?: any[]
      modifierGroups?: any[]
      ingredients?: any[]
    }
  ): Promise<ProductWithFull>

  /**
   * Soft-deletes a product by setting deletedAt.
   */
  softDelete(id: string): Promise<void>

  /**
   * Restores a soft-deleted product by setting deletedAt to null.
   */
  restore(id: string): Promise<void>

  /**
   * Creates a duplicate copy of a product with a new SKU and Slug.
   */
  duplicate(id: string, newSku: string, newSlug: string): Promise<ProductWithFull>

  /**
   * Creates a snapshot version record of the product.
   */
  createVersion(version: Omit<ProductVersion, 'id' | 'createdAt'>): Promise<ProductVersion>

  /**
   * Lists all snapshot versions for a product.
   */
  findVersionsByProductId(productId: string): Promise<ProductVersion[]>

  /**
   * Creates an audit log record for a catalog event.
   */
  createAuditLog(
    productId: string,
    event: string,
    details?: Record<string, any>,
    userId?: string
  ): Promise<CatalogAuditLog>

  /**
   * Lists all audit logs for a product.
   */
  findAuditLogsByProductId(productId: string): Promise<CatalogAuditLog[]>

  /**
   * Finds all categories in menus belonging to the organization.
   */
  findCategories(organizationId: string): Promise<{ id: string; name: string }[]>

  /**
   * Finds all ingredients belonging to the organization.
   */
  findIngredients(organizationId: string): Promise<Ingredient[]>
}
