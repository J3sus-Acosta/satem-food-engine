import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { IProductRepository } from '@/repositories'
import type {
  Product,
  ProductVariant,
  ProductWithFull,
  CreateProductInput,
  UpdateProductInput,
  PaginationParams,
} from '@/types'

/**
 * Service handling catalog and product business logic.
 *
 * Rules:
 * - Independent of React and Prisma.
 * - Depends only on repository interfaces and domain types.
 */
export class ProductService {
  constructor(private readonly productRepo: IProductRepository) {}

  /**
   * Retrieves a product with its variants, modifier groups, and modifiers.
   * Throws NotFoundError if not found.
   */
  async getProduct(id: string): Promise<ProductWithFull> {
    throw new NotImplementedError('ProductService.getProduct')
  }

  /**
   * Lists products for an organization with pagination.
   */
  async listProducts(organizationId: string, options?: PaginationParams): Promise<Product[]> {
    throw new NotImplementedError('ProductService.listProducts')
  }

  /**
   * Creates a new product.
   * Ensures the product name is valid and unique within the organization if required.
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    throw new NotImplementedError('ProductService.createProduct')
  }

  /**
   * Updates product details.
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    throw new NotImplementedError('ProductService.updateProduct')
  }

  /**
   * Soft deletes a product and its cascading dependencies (variants, modifiers).
   */
  async deleteProduct(id: string): Promise<void> {
    throw new NotImplementedError('ProductService.deleteProduct')
  }

  /**
   * Adds a new variant to a product.
   */
  async addVariant(productId: string, name: string, sku?: string): Promise<ProductVariant> {
    throw new NotImplementedError('ProductService.addVariant')
  }

  /**
   * Sets a specific variant as the default for a product.
   */
  async setDefaultVariant(productId: string, variantId: string): Promise<void> {
    throw new NotImplementedError('ProductService.setDefaultVariant')
  }
}
