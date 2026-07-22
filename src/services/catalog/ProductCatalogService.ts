/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only'

import { NotFoundError, ValidationError } from '@/lib/errors'
import type { IProductCatalogRepository } from '@/repositories/interfaces/IProductCatalogRepository'
import type {
  ProductWithFull,
  ProductVersion,
  CatalogAuditLog,
  CreateProductInput,
  UpdateProductInput,
  ProductCatalogListFilters,
  Ingredient,
} from '@/types'

export class ProductCatalogService {
  constructor(private readonly catalogRepo: IProductCatalogRepository) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  /**
   * Helper to capture a snapshot of the current state of a product
   * and save it as a new version.
   */
  private async captureVersion(
    productId: string,
    userId: string | null,
    changeReason: string | null
  ): Promise<ProductVersion> {
    const product = await this.catalogRepo.findById(productId, true)
    if (!product) {
      throw new NotFoundError('Product', productId)
    }

    const latestVersion = await this.catalogRepo.getLatestVersionNumber(productId)
    const nextVersion = latestVersion + 1

    const productSnapshot = {
      id: product.id,
      organizationId: product.organizationId,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      longDescription: product.longDescription,
      imageUrl: product.imageUrl,
    }

    const variantsSnapshot = product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    }))

    const modifiersSnapshot = product.modifierGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      isRequired: g.isRequired,
      sortOrder: g.sortOrder,
      isActive: g.isActive,
      modifiers: g.modifiers.map((m) => ({
        id: m.id,
        name: m.name,
        priceExtra: m.priceExtra,
        sortOrder: m.sortOrder,
        isActive: m.isActive,
      })),
    }))

    const ingredientsSnapshot = (product.ingredients || []).map((i: any) => ({
      id: i.id,
      ingredientId: i.ingredientId,
      quantity: i.quantity,
      cost: i.cost,
    }))

    const pricesSnapshot = {
      basePrice: product.basePrice,
      cost: product.cost,
      taxCategory: product.taxCategory,
    }

    const configSnapshot = {
      isActive: product.isActive,
      visibleByDefault: product.visibleByDefault,
      highlightedByDefault: product.highlightedByDefault,
      estimatedPrepTime: product.estimatedPrepTime,
      notes: product.notes,
      sortOrder: product.sortOrder,
      metadata: product.metadata,
    }

    return this.catalogRepo.createVersion({
      productId,
      versionNumber: nextVersion,
      userId,
      changeReason,
      productSnapshot,
      variantsSnapshot,
      modifiersSnapshot,
      ingredientsSnapshot,
      pricesSnapshot,
      configSnapshot,
    })
  }

  /**
   * Retrieves a single product with full variants, modifiers, and ingredients.
   * Throws NotFoundError if not found.
   */
  async findProduct(id: string, includeDeleted = false): Promise<ProductWithFull> {
    const product = await this.catalogRepo.findById(id, includeDeleted)
    if (!product) {
      throw new NotFoundError('Product', id)
    }
    return product
  }

  /**
   * Lists products for an organization with filtering and pagination.
   */
  async findProducts(
    organizationId: string,
    filters: ProductCatalogListFilters,
    page = 1,
    limit = 10
  ): Promise<{ products: ProductWithFull[]; total: number }> {
    return this.catalogRepo.findProducts(organizationId, filters, page, limit)
  }

  /**
   * Creates a new product. Validates SKU and Slug uniqueness.
   */
  async createProduct(
    data: CreateProductInput & { defaultCategoryId?: string },
    userId: string | null = null
  ): Promise<ProductWithFull> {
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('El nombre del producto es obligatorio')
    }

    const slug = data.slug ? this.slugify(data.slug) : this.slugify(data.name)
    if (!slug) {
      throw new ValidationError('No se pudo generar un slug válido')
    }

    // Validate Slug uniqueness
    const isSlugUnique = await this.catalogRepo.isSlugUnique(slug)
    if (!isSlugUnique) {
      throw new ValidationError(`El slug "${slug}" ya está en uso por otro producto`)
    }

    // Validate SKU uniqueness
    if (data.sku) {
      const isSkuUnique = await this.catalogRepo.isSkuUnique(data.organizationId, data.sku)
      if (!isSkuUnique) {
        throw new ValidationError(`El SKU "${data.sku}" ya está en uso`)
      }
    }

    // Validate base price > 0
    if (data.basePrice !== undefined && data.basePrice !== null && data.basePrice <= 0) {
      throw new ValidationError('El precio base debe ser mayor a cero')
    }

    const product = await this.catalogRepo.create({
      ...data,
      slug,
    })

    // Capture initial snapshot version 1
    await this.captureVersion(product.id, userId, 'Creación inicial del producto')

    // Log audit event
    await this.catalogRepo.createAuditLog(product.id, 'CREATED', {}, userId || undefined)

    return product
  }

  /**
   * Updates an existing product and triggers version capture.
   */
  async updateProduct(
    id: string,
    data: UpdateProductInput & {
      defaultCategoryId?: string
      variants?: any[]
      modifierGroups?: any[]
      ingredients?: any[]
    },
    userId: string | null = null,
    changeReason: string | null = null
  ): Promise<ProductWithFull> {
    const existing = await this.findProduct(id, true)

    // Validate slug uniqueness if changing
    if (data.slug && data.slug !== existing.slug) {
      const slug = this.slugify(data.slug)
      const isSlugUnique = await this.catalogRepo.isSlugUnique(slug, id)
      if (!isSlugUnique) {
        throw new ValidationError(`El slug "${slug}" ya está en uso`)
      }
      data.slug = slug
    }

    // Validate SKU uniqueness if changing
    if (data.sku && data.sku !== existing.sku) {
      const isSkuUnique = await this.catalogRepo.isSkuUnique(existing.organizationId, data.sku, id)
      if (!isSkuUnique) {
        throw new ValidationError(`El SKU "${data.sku}" ya está en uso`)
      }
    }

    // Validate base price > 0
    if (data.basePrice !== undefined && data.basePrice !== null && data.basePrice <= 0) {
      throw new ValidationError('El precio base debe ser mayor a cero')
    }

    // 1. Capture snapshot of current state before modification
    await this.captureVersion(id, userId, changeReason || 'Modificación de atributos')

    // 2. Perform database update
    const updated = await this.catalogRepo.update(id, data)

    // 3. Log audit event
    await this.catalogRepo.createAuditLog(
      id,
      'UPDATED',
      { changeReason: changeReason || undefined },
      userId || undefined
    )

    return updated
  }

  /**
   * Soft deletes a product.
   */
  async deleteProduct(id: string, userId: string | null = null): Promise<void> {
    await this.findProduct(id)

    // Capture snapshot of current state before delete
    await this.captureVersion(id, userId, 'Eliminación lógica')

    await this.catalogRepo.softDelete(id)

    await this.catalogRepo.createAuditLog(id, 'DELETED', {}, userId || undefined)
  }

  /**
   * Restores a soft-deleted product.
   */
  async restoreProduct(id: string, userId: string | null = null): Promise<void> {
    await this.findProduct(id, true)

    // Capture snapshot before restoring
    await this.captureVersion(id, userId, 'Restauración de producto')

    await this.catalogRepo.restore(id)

    await this.catalogRepo.createAuditLog(id, 'RESTORED', {}, userId || undefined)
  }

  /**
   * Creates a duplicate copy of a product.
   */
  async duplicateProduct(id: string, userId: string | null = null): Promise<ProductWithFull> {
    const original = await this.findProduct(id, true)

    // Generate unique SKU
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const newSku = original.sku
      ? `${original.sku}-COPY-${randomSuffix}`
      : `SKU-COPY-${randomSuffix}`
    const newSlug = original.slug
      ? `${original.slug}-copia-${randomSuffix}`
      : `slug-copia-${randomSuffix}`

    const cloned = await this.catalogRepo.duplicate(id, newSku, newSlug)

    // Capture initial version 1 for clone
    await this.captureVersion(cloned.id, userId, 'Clonado desde el producto ' + original.name)

    // Log audit events
    await this.catalogRepo.createAuditLog(
      cloned.id,
      'CREATED',
      { duplicatedFrom: id },
      userId || undefined
    )
    await this.catalogRepo.createAuditLog(
      id,
      'DUPLICATED',
      { duplicatedTo: cloned.id },
      userId || undefined
    )

    return cloned
  }

  /**
   * Retrieves version history list for a product.
   */
  async findVersions(productId: string): Promise<ProductVersion[]> {
    await this.findProduct(productId, true)
    return this.catalogRepo.findVersionsByProductId(productId)
  }

  /**
   * Retrieves audit logs list for a product.
   */
  async findAuditLogs(productId: string): Promise<CatalogAuditLog[]> {
    await this.findProduct(productId, true)
    return this.catalogRepo.findAuditLogsByProductId(productId)
  }

  /**
   * Restores a product state to a previous version snapshot.
   */
  async restoreProductVersion(
    productId: string,
    versionId: string,
    userId: string | null = null
  ): Promise<ProductWithFull> {
    await this.findProduct(productId, true)
    const version = await this.catalogRepo.findVersionById(versionId)

    if (!version) {
      throw new NotFoundError('ProductVersion', versionId)
    }

    if (version.productId !== productId) {
      throw new ValidationError('La versión no corresponde al producto especificado')
    }

    // 1. Capture current state as a new version before rolling back
    await this.captureVersion(
      productId,
      userId,
      `Restauración a la versión número ${version.versionNumber}`
    )

    // 2. Map snapshots back to database fields
    const pSnap = version.productSnapshot
    const priceSnap = version.pricesSnapshot
    const configSnap = version.configSnapshot

    const updateData: any = {
      name: pSnap.name,
      description: pSnap.description,
      shortDescription: pSnap.shortDescription,
      longDescription: pSnap.longDescription,
      imageUrl: pSnap.imageUrl,
      basePrice: priceSnap.basePrice,
      cost: priceSnap.cost,
      taxCategory: priceSnap.taxCategory,
      isActive: configSnap.isActive,
      visibleByDefault: configSnap.visibleByDefault,
      highlightedByDefault: configSnap.highlightedByDefault,
      estimatedPrepTime: configSnap.estimatedPrepTime,
      notes: configSnap.notes,
      sortOrder: configSnap.sortOrder,
      metadata: configSnap.metadata,
      variants: version.variantsSnapshot,
      modifierGroups: version.modifiersSnapshot,
      ingredients: version.ingredientsSnapshot.map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        cost: i.cost,
      })),
    }

    // 3. Perform database update restoring snapshots
    const restored = await this.catalogRepo.update(productId, updateData)

    // 4. Log audit log event
    await this.catalogRepo.createAuditLog(
      productId,
      'VERSION_RESTORED',
      { versionNumber: version.versionNumber },
      userId || undefined
    )

    return restored
  }

  /**
   * Retrieves all categories belonging to the organization's menus.
   */
  async getCategories(organizationId: string): Promise<{ id: string; name: string }[]> {
    return this.catalogRepo.findCategories(organizationId)
  }

  /**
   * Retrieves all active ingredients for the organization.
   */
  async getIngredients(organizationId: string): Promise<Ingredient[]> {
    return this.catalogRepo.findIngredients(organizationId)
  }
}
