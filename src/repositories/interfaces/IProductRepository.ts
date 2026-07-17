import type {
  Product,
  ProductVariant,
  ProductWithVariants,
  ProductWithFull,
  CreateProductInput,
  UpdateProductInput,
  CreateProductVariantInput,
  PaginationParams,
} from '@/types'

/**
 * Repository contract for the Product aggregate.
 *
 * Rules:
 * - All methods return domain types, NOT Prisma types.
 * - Soft-deleted records are excluded by default unless stated otherwise.
 * - This interface must remain independent of any persistence technology.
 */
export interface IProductRepository {
  /**
   * Find a product by its unique identifier.
   * Returns null if not found or soft-deleted.
   */
  findById(id: string): Promise<Product | null>

  /**
   * Find a product with its variants included.
   * Returns null if not found or soft-deleted.
   */
  findByIdWithVariants(id: string): Promise<ProductWithVariants | null>

  /**
   * Find a product with its full catalog tree:
   * variants, modifier groups, and modifiers.
   */
  findByIdWithFull(id: string): Promise<ProductWithFull | null>

  /**
   * List all active products belonging to an organization.
   */
  findByOrganizationId(organizationId: string, options?: PaginationParams): Promise<Product[]>

  /**
   * Count products for an organization (for pagination).
   */
  countByOrganizationId(organizationId: string): Promise<number>

  /**
   * Find a product by SKU within an organization.
   * Returns null if not found.
   */
  findBySku(organizationId: string, sku: string): Promise<Product | null>

  /**
   * Persist a new product and return the created entity.
   */
  create(data: CreateProductInput): Promise<Product>

  /**
   * Update an existing product by ID and return the updated entity.
   * Throws NotFoundError if the product does not exist.
   */
  update(id: string, data: UpdateProductInput): Promise<Product>

  /**
   * Soft-delete a product by setting deletedAt.
   * Also soft-deletes all related variants and modifier groups.
   */
  softDelete(id: string): Promise<void>

  /**
   * Create a variant for a product.
   */
  createVariant(data: CreateProductVariantInput): Promise<ProductVariant>

  /**
   * Set the default variant for a product.
   * Unsets any previously default variant first.
   */
  setDefaultVariant(productId: string, variantId: string): Promise<void>
}
