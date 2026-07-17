/**
 * Prisma implementation of IProductRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 * It translates between Prisma models and domain types.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { IProductRepository } from '@/repositories/interfaces'
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
 * Prisma-backed implementation of the Product repository.
 *
 * Responsibilities:
 * - Map Prisma `Decimal` fields to `Money` (number).
 * - Apply `deletedAt: null` filter on all queries (soft-delete).
 * - Use `db.$transaction` for multi-step mutations (e.g., softDelete cascade).
 */
export class PrismaProductRepository implements IProductRepository {
  async findById(_id: string): Promise<Product | null> {
    throw new NotImplementedError('PrismaProductRepository.findById')
  }

  async findByIdWithVariants(_id: string): Promise<ProductWithVariants | null> {
    throw new NotImplementedError('PrismaProductRepository.findByIdWithVariants')
  }

  async findByIdWithFull(_id: string): Promise<ProductWithFull | null> {
    throw new NotImplementedError('PrismaProductRepository.findByIdWithFull')
  }

  async findByOrganizationId(
    _organizationId: string,
    _options?: PaginationParams
  ): Promise<Product[]> {
    throw new NotImplementedError('PrismaProductRepository.findByOrganizationId')
  }

  async countByOrganizationId(_organizationId: string): Promise<number> {
    throw new NotImplementedError('PrismaProductRepository.countByOrganizationId')
  }

  async findBySku(_organizationId: string, _sku: string): Promise<Product | null> {
    throw new NotImplementedError('PrismaProductRepository.findBySku')
  }

  async create(_data: CreateProductInput): Promise<Product> {
    throw new NotImplementedError('PrismaProductRepository.create')
  }

  async update(_id: string, _data: UpdateProductInput): Promise<Product> {
    throw new NotImplementedError('PrismaProductRepository.update')
  }

  async softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('PrismaProductRepository.softDelete')
  }

  async createVariant(_data: CreateProductVariantInput): Promise<ProductVariant> {
    throw new NotImplementedError('PrismaProductRepository.createVariant')
  }

  async setDefaultVariant(_productId: string, _variantId: string): Promise<void> {
    throw new NotImplementedError('PrismaProductRepository.setDefaultVariant')
  }
}
