import 'server-only'

import { NotFoundError, ValidationError } from '@/lib/errors'
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
  DailyMenuRowInput,
  DailyMenuPreviewItem,
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

  /**
   * Validates and previews daily menu changes from Google Sheets rows.
   * Throws ValidationError if any validation fails.
   */
  /**
   * Validates and previews daily menu changes from Google Sheets rows.
   * Throws ValidationError if any validation fails.
   */
  async previewDailyMenuOverrides(
    locationId: string,
    rows: DailyMenuRowInput[]
  ): Promise<DailyMenuPreviewItem[]> {
    const errors: string[] = []
    const previewItems: DailyMenuPreviewItem[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 1
      const code = String(row.Código || '').trim()

      if (!code) {
        errors.push(`Fila ${rowNum}: El campo 'Código' es obligatorio.`)
        continue
      }

      // Find MenuItem
      const menuItem = await this.catalogRepo.findMenuItemBySku(locationId, code)
      if (!menuItem) {
        errors.push(`Fila ${rowNum}: Código '${code}' no existe en este local.`)
        continue
      }

      // Parse and validate availability
      const disponibleStr = String(row.Disponible || '')
        .trim()
        .toUpperCase()
      if (disponibleStr !== 'SI' && disponibleStr !== 'NO') {
        errors.push(`Fila ${rowNum} (${code}): 'Disponible' debe ser 'SI' o 'NO'.`)
      }
      const isAvailable = disponibleStr === 'SI'

      // Parse and validate visibility
      const visibleStr = String(row.Visible || '')
        .trim()
        .toUpperCase()
      if (visibleStr !== 'SI' && visibleStr !== 'NO') {
        errors.push(`Fila ${rowNum} (${code}): 'Visible' debe ser 'SI' o 'NO'.`)
      }
      const isVisible = visibleStr === 'SI'

      // Parse and validate highlighted
      const destacadoStr = String(row.Destacado || '')
        .trim()
        .toUpperCase()
      if (destacadoStr !== 'SI' && destacadoStr !== 'NO') {
        errors.push(`Fila ${rowNum} (${code}): 'Destacado' debe ser 'SI' o 'NO'.`)
      }
      const isHighlighted = destacadoStr === 'SI'

      // Parse and validate price
      let price: number | null = null
      if (row.Precio !== undefined && row.Precio !== null && String(row.Precio).trim() !== '') {
        const val = Number(row.Precio)
        if (isNaN(val) || val <= 0) {
          errors.push(`Fila ${rowNum} (${code}): 'Precio' debe ser un número positivo.`)
        } else {
          price = val
        }
      }

      // Parse and validate stock
      let stockDaily: number | null = null
      if (row.Stock !== undefined && row.Stock !== null && String(row.Stock).trim() !== '') {
        const val = Number(row.Stock)
        if (isNaN(val) || val < 0) {
          errors.push(`Fila ${rowNum} (${code}): 'Stock' debe ser un número entero no negativo.`)
        } else {
          stockDaily = Math.floor(val)
        }
      }

      // Parse and validate sortOrder
      let sortOrder: number | null = null
      if (row.Orden !== undefined && row.Orden !== null && String(row.Orden).trim() !== '') {
        const val = Number(row.Orden)
        if (isNaN(val) || val < 0) {
          errors.push(`Fila ${rowNum} (${code}): 'Orden' debe ser un número entero no negativo.`)
        } else {
          sortOrder = Math.floor(val)
        }
      }

      const notes = row.Nota ? String(row.Nota).trim() : null

      if (errors.length > 0) {
        continue
      }

      // Calculate before values
      const currentOverride = menuItem.dailyMenuOverride
      const beforePrice = currentOverride?.price ?? menuItem.price
      const beforeAvailable = currentOverride?.isAvailable ?? menuItem.isAvailable
      const beforeVisible = currentOverride?.isVisible ?? menuItem.isVisible
      const beforeSortOrder = currentOverride?.sortOrder ?? menuItem.sortOrder
      const beforeHighlighted = currentOverride?.isHighlighted ?? false
      const beforeStock = currentOverride?.stockDaily ?? null
      const beforeNotes = currentOverride?.notes ?? null

      // Calculate after values
      const afterPrice = price ?? menuItem.price
      let afterAvailable = isAvailable
      if (stockDaily !== null && stockDaily <= 0) {
        afterAvailable = false
      }

      previewItems.push({
        code,
        name: menuItem.name || '',
        before: {
          price: beforePrice,
          isAvailable: beforeAvailable,
          isVisible: beforeVisible,
          sortOrder: beforeSortOrder,
          isHighlighted: beforeHighlighted,
          stockDaily: beforeStock,
          notes: beforeNotes,
        },
        after: {
          price: afterPrice,
          isAvailable: afterAvailable,
          isVisible,
          sortOrder: sortOrder ?? menuItem.sortOrder,
          isHighlighted,
          stockDaily,
          notes,
        },
      })
    }

    if (errors.length > 0) {
      // Throw ValidationError containing list of all errors separated by pipe
      throw new ValidationError(errors.join(' | '))
    }

    return previewItems
  }

  /**
   * Applies daily menu overrides to the database after validation.
   */
  async applyDailyMenuOverrides(
    locationId: string,
    rows: DailyMenuRowInput[]
  ): Promise<{ code: string; status: 'success' }[]> {
    // 1. Validate all rows (this throws ValidationError if anything is wrong)
    const preview = await this.previewDailyMenuOverrides(locationId, rows)

    // 2. Perform writes
    const results = []
    for (const previewItem of preview) {
      const menuItem = await this.catalogRepo.findMenuItemBySku(locationId, previewItem.code)
      if (!menuItem) {
        continue
      }

      const overrideRow = rows.find((r) => String(r.Código || '').trim() === previewItem.code)
      if (!overrideRow) {
        continue
      }
      const isAvailable =
        String(overrideRow.Disponible || '')
          .trim()
          .toUpperCase() === 'SI'
      const isVisible =
        String(overrideRow.Visible || '')
          .trim()
          .toUpperCase() === 'SI'
      const isHighlighted =
        String(overrideRow.Destacado || '')
          .trim()
          .toUpperCase() === 'SI'

      let price: number | null = null
      if (
        overrideRow.Precio !== undefined &&
        overrideRow.Precio !== null &&
        String(overrideRow.Precio).trim() !== ''
      ) {
        price = Number(overrideRow.Precio)
      }

      let stockDaily: number | null = null
      if (
        overrideRow.Stock !== undefined &&
        overrideRow.Stock !== null &&
        String(overrideRow.Stock).trim() !== ''
      ) {
        stockDaily = Math.floor(Number(overrideRow.Stock))
      }

      let sortOrder: number | null = null
      if (
        overrideRow.Orden !== undefined &&
        overrideRow.Orden !== null &&
        String(overrideRow.Orden).trim() !== ''
      ) {
        sortOrder = Math.floor(Number(overrideRow.Orden))
      }

      const notes = overrideRow.Nota ? String(overrideRow.Nota).trim() : null

      await this.catalogRepo.upsertDailyMenuOverride(menuItem.id, {
        price,
        isAvailable,
        stockDaily,
        isHighlighted,
        isVisible,
        sortOrder,
        notes,
      })

      results.push({
        code: previewItem.code,
        status: 'success' as const,
      })
    }

    return results
  }
}

// Instantiate and export service singletons
const productRepo = new PrismaProductRepository()
const catalogRepo = new PrismaCatalogRepository()
export const productService = new ProductService(productRepo, catalogRepo)
