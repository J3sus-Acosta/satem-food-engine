import 'server-only'

import { NotFoundError } from '@/lib/errors'
import { PrismaProductRepository } from '@/repositories/prisma/PrismaProductRepository'
import { PrismaCatalogRepository } from '@/repositories/prisma/PrismaCatalogRepository'
import type { IProductRepository, ICatalogRepository } from '@/repositories'
import type {
  Product,
  ProductVariant,
  ProductWithFull,
  CreateProductInput,
  UpdateProductInput,
  PaginationParams,
  MenuWithCategories,
  Category,
} from '@/types'

/**
 * Service handling catalog and product business logic.
 *
 * Rules:
 * - Independent of React and Prisma (receives repository interfaces).
 */
export class ProductService {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly catalogRepo: ICatalogRepository
  ) {}

  /**
   * Retrieves the full active menu/catalog with all items, categories, variants, and modifiers
   * for a given location slug or ID.
   */
  async getMenu(locationSlugOrId: string): Promise<MenuWithCategories> {
    // Try by slug first
    let menu = await this.catalogRepo.findMenuByLocationSlug(locationSlugOrId)
    if (!menu) {
      // Try by ID
      menu = await this.catalogRepo.findMenuByLocationId(locationSlugOrId)
    }

    if (!menu) {
      throw new NotFoundError('Menu', locationSlugOrId)
    }

    return menu
  }

  /**
   * Lists categories for a menu.
   */
  async getCategories(menuId: string): Promise<Category[]> {
    return this.catalogRepo.findCategoriesByMenuId(menuId)
  }

  /**
   * Lists all products for an organization.
   */
  async getProducts(organizationId: string): Promise<Product[]> {
    return this.catalogRepo.findProductsByOrganizationId(organizationId)
  }

  /**
   * Finds a product by its URL slug.
   */
  async getProductBySlug(organizationId: string, slug: string): Promise<ProductWithFull> {
    const product = await this.catalogRepo.findProductBySlug(organizationId, slug)
    if (!product) {
      throw new NotFoundError('Product', slug)
    }
    return product
  }

  /**
   * Retrieves a product with its variants, modifier groups, and modifiers by ID.
   * Throws NotFoundError if not found.
   */
  async getProduct(id: string): Promise<ProductWithFull> {
    const product = await this.productRepo.findByIdWithFull(id)
    if (!product) {
      throw new NotFoundError('Product', id)
    }
    return product
  }

  /**
   * Lists products for an organization with pagination.
   */
  async listProducts(organizationId: string, options?: PaginationParams): Promise<Product[]> {
    return this.productRepo.findByOrganizationId(organizationId, options)
  }

  /**
   * Creates a new product.
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    return this.productRepo.create(data)
  }

  /**
   * Updates product details.
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    return this.productRepo.update(id, data)
  }

  /**
   * Soft deletes a product and its cascading dependencies.
   */
  async deleteProduct(id: string): Promise<void> {
    return this.productRepo.softDelete(id)
  }

  /**
   * Adds a new variant to a product.
   */
  async addVariant(productId: string, name: string, sku?: string): Promise<ProductVariant> {
    return this.productRepo.createVariant({ productId, name, sku })
  }

  /**
   * Sets a specific variant as the default for a product.
   */
  async setDefaultVariant(productId: string, variantId: string): Promise<void> {
    return this.productRepo.setDefaultVariant(productId, variantId)
  }
}

// Instantiate and export service singletons
const productRepo = new PrismaProductRepository()
const catalogRepo = new PrismaCatalogRepository()
export const productService = new ProductService(productRepo, catalogRepo)
