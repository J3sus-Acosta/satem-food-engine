/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only'

import { db } from '@/server/db'
import type { IProductCatalogRepository } from '../interfaces/IProductCatalogRepository'
import type {
  ProductVersion,
  CatalogAuditLog,
  CreateProductInput,
  UpdateProductInput,
  ProductWithFull,
  ProductCatalogListFilters,
  TaxCategory,
  Ingredient,
} from '@/types'

export class PrismaProductCatalogRepository implements IProductCatalogRepository {
  private mapProductToDomain(p: any): ProductWithFull {
    const defaultVariant = p.variants?.find((v: any) => v.isDefault)
    const defaultMenuItem = defaultVariant?.menuItems?.[0]
    const defaultCategory = defaultMenuItem?.category

    return {
      id: p.id,
      organizationId: p.organizationId,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      longDescription: p.longDescription,
      imageUrl: p.imageUrl,
      basePrice: p.basePrice ? Number(p.basePrice) : null,
      cost: p.cost ? Number(p.cost) : null,
      isAlcoholic: p.isAlcoholic,
      taxCategory: p.taxCategory as TaxCategory,
      isActive: p.isActive,
      visibleByDefault: p.visibleByDefault,
      highlightedByDefault: p.highlightedByDefault,
      estimatedPrepTime: p.estimatedPrepTime,
      notes: p.notes,
      sortOrder: p.sortOrder,
      metadata: p.metadata as Record<string, unknown>,
      defaultCategoryId: defaultCategory?.id || null,
      defaultCategoryName: defaultCategory?.name || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        productId: v.productId,
        name: v.name,
        sku: v.sku,
        isDefault: v.isDefault,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        deletedAt: v.deletedAt,
      })),
      modifierGroups: (p.modifierGroups || []).map((g: any) => ({
        id: g.id,
        productId: g.productId,
        name: g.name,
        description: g.description,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        isRequired: g.isRequired,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        deletedAt: g.deletedAt,
        modifiers: (g.modifiers || []).map((m: any) => ({
          id: m.id,
          modifierGroupId: m.modifierGroupId,
          name: m.name,
          priceExtra: Number(m.priceExtra),
          sortOrder: m.sortOrder,
          isActive: m.isActive,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          deletedAt: m.deletedAt,
        })),
      })),
      ingredients: (p.ingredients || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        ingredientId: i.ingredientId,
        quantity: Number(i.quantity),
        cost: Number(i.cost),
        ingredient: i.ingredient
          ? {
              name: i.ingredient.name,
              unit: i.ingredient.unit,
            }
          : undefined,
      })),
    }
  }

  async findById(id: string, includeDeleted = false): Promise<ProductWithFull | null> {
    const product = await db.product.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        variants: {
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              include: {
                category: true,
              },
            },
          },
        },
        modifierGroups: {
          include: {
            modifiers: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    })

    if (!product) return null
    return this.mapProductToDomain(product)
  }

  async findVersionById(versionId: string): Promise<ProductVersion | null> {
    const version = await db.productVersion.findUnique({
      where: { id: versionId },
    })

    if (!version) return null

    return {
      id: version.id,
      productId: version.productId,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      userId: version.userId,
      changeReason: version.changeReason,
      productSnapshot: version.productSnapshot as Record<string, any>,
      variantsSnapshot: version.variantsSnapshot as Record<string, any>[],
      modifiersSnapshot: version.modifiersSnapshot as Record<string, any>[],
      ingredientsSnapshot: version.ingredientsSnapshot as Record<string, any>[],
      pricesSnapshot: version.pricesSnapshot as Record<string, any>,
      configSnapshot: version.configSnapshot as Record<string, any>,
    }
  }

  async getLatestVersionNumber(productId: string): Promise<number> {
    const result = await db.productVersion.findFirst({
      where: { productId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    })

    return result ? result.versionNumber : 0
  }

  async findProducts(
    organizationId: string,
    filters: ProductCatalogListFilters,
    page: number,
    limit: number
  ): Promise<{ products: ProductWithFull[]; total: number }> {
    const skip = (page - 1) * limit

    const where: any = {
      organizationId,
    }

    // Status filter
    if (filters.status === 'deleted') {
      where.deletedAt = { not: null }
    } else if (filters.status === 'active') {
      where.isActive = true
      where.deletedAt = null
    } else if (filters.status === 'inactive') {
      where.isActive = false
      where.deletedAt = null
    } else {
      // 'all' (default)
      where.deletedAt = null
    }

    // Image filter
    if (filters.hasImage === 'with') {
      where.imageUrl = { not: null }
    } else if (filters.hasImage === 'without') {
      where.imageUrl = null
    }

    // Variants filter
    if (filters.hasVariants === 'with') {
      where.variants = { some: {} }
    } else if (filters.hasVariants === 'without') {
      where.variants = { none: {} }
    }

    // Modifiers filter
    if (filters.hasModifiers === 'with') {
      where.modifierGroups = { some: {} }
    } else if (filters.hasModifiers === 'without') {
      where.modifierGroups = { none: {} }
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { longDescription: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Sorting
    const orderBy: any = {}
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc'
    } else {
      orderBy.name = 'asc'
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          variants: {
            orderBy: { sortOrder: 'asc' },
            include: {
              menuItems: {
                include: {
                  category: true,
                },
              },
            },
          },
          modifierGroups: {
            include: {
              modifiers: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return {
      products: products.map((p) => this.mapProductToDomain(p)),
      total,
    }
  }

  async isSkuUnique(
    organizationId: string,
    sku: string,
    excludingProductId?: string
  ): Promise<boolean> {
    const existing = await db.product.findFirst({
      where: {
        organizationId,
        sku,
        deletedAt: null,
        ...(excludingProductId ? { id: { not: excludingProductId } } : {}),
      },
    })
    return !existing
  }

  async isSlugUnique(slug: string, excludingProductId?: string): Promise<boolean> {
    const existing = await db.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludingProductId ? { id: { not: excludingProductId } } : {}),
      },
    })
    return !existing
  }

  async create(
    data: CreateProductInput & { defaultCategoryId?: string }
  ): Promise<ProductWithFull> {
    return db.$transaction(async (tx) => {
      // 1. Create product
      const product = await tx.product.create({
        data: {
          organizationId: data.organizationId,
          sku: data.sku || null,
          slug: data.slug || null,
          name: data.name,
          description: data.description || null,
          shortDescription: data.shortDescription || null,
          longDescription: data.longDescription || null,
          imageUrl: data.imageUrl || null,
          basePrice: data.basePrice !== undefined ? data.basePrice : null,
          cost: data.cost !== undefined ? data.cost : null,
          isAlcoholic: data.isAlcoholic || false,
          taxCategory: data.taxCategory || 'STANDARD',
          isActive: data.isActive !== undefined ? data.isActive : true,
          visibleByDefault: data.visibleByDefault !== undefined ? data.visibleByDefault : true,
          highlightedByDefault:
            data.highlightedByDefault !== undefined ? data.highlightedByDefault : false,
          estimatedPrepTime: data.estimatedPrepTime || null,
          notes: data.notes || null,
          sortOrder: data.sortOrder || 0,
          metadata: (data.metadata as any) || {},
        },
      })

      // 2. Create default variant "Estándar"
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          name: 'Estándar',
          sku: data.sku || null,
          isDefault: true,
          sortOrder: 0,
          isActive: true,
        },
      })

      // 3. Link to category if defaultCategoryId is provided
      if (data.defaultCategoryId) {
        await tx.menuItem.create({
          data: {
            categoryId: data.defaultCategoryId,
            productVariantId: variant.id,
            price: data.basePrice !== undefined ? data.basePrice : 0,
            isAvailable: true,
            isVisible: data.visibleByDefault !== undefined ? data.visibleByDefault : true,
            sortOrder: 0,
            imageUrl: data.imageUrl || null,
          },
        })
      }

      // Re-fetch product with all relations to map to domain
      const fullProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          variants: {
            include: {
              menuItems: {
                include: {
                  category: true,
                },
              },
            },
          },
          modifierGroups: {
            include: { modifiers: true },
          },
          ingredients: {
            include: { ingredient: true },
          },
        },
      })

      return this.mapProductToDomain(fullProduct)
    })
  }

  async update(
    id: string,
    data: UpdateProductInput & {
      defaultCategoryId?: string
      variants?: any[]
      modifierGroups?: any[]
      ingredients?: any[]
    }
  ): Promise<ProductWithFull> {
    return db.$transaction(async (tx) => {
      // 1. Update product base fields
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.sku !== undefined) updateData.sku = data.sku
      if (data.slug !== undefined) updateData.slug = data.slug
      if (data.description !== undefined) updateData.description = data.description
      if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription
      if (data.longDescription !== undefined) updateData.longDescription = data.longDescription
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.basePrice !== undefined) updateData.basePrice = data.basePrice
      if (data.cost !== undefined) updateData.cost = data.cost
      if (data.isAlcoholic !== undefined) updateData.isAlcoholic = data.isAlcoholic
      if (data.taxCategory !== undefined) updateData.taxCategory = data.taxCategory
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.visibleByDefault !== undefined) updateData.visibleByDefault = data.visibleByDefault
      if (data.highlightedByDefault !== undefined)
        updateData.highlightedByDefault = data.highlightedByDefault
      if (data.estimatedPrepTime !== undefined)
        updateData.estimatedPrepTime = data.estimatedPrepTime
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      await tx.product.update({
        where: { id },
        data: updateData,
      })

      // 2. Manage variants if provided
      if (data.variants) {
        // Soft delete all variants not in the new list, keep default one
        const currentVariants = await tx.productVariant.findMany({
          where: { productId: id, deletedAt: null },
        })
        const inputVariantIds = data.variants.map((v) => v.id).filter(Boolean)

        for (const currentV of currentVariants) {
          if (!inputVariantIds.includes(currentV.id) && !currentV.isDefault) {
            await tx.productVariant.update({
              where: { id: currentV.id },
              data: { deletedAt: new Date(), isActive: false },
            })
          }
        }

        // Upsert variants
        for (const v of data.variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku || null,
                sortOrder: v.sortOrder || 0,
                isActive: v.isActive !== undefined ? v.isActive : true,
              },
            })
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                sku: v.sku || null,
                isDefault: false,
                sortOrder: v.sortOrder || 0,
                isActive: v.isActive !== undefined ? v.isActive : true,
              },
            })
          }
        }
      }

      // 3. Manage modifier groups if provided
      if (data.modifierGroups) {
        const currentGroups = await tx.modifierGroup.findMany({
          where: { productId: id, deletedAt: null },
        })
        const inputGroupIds = data.modifierGroups.map((g) => g.id).filter(Boolean)

        // Delete groups not in input
        for (const currentG of currentGroups) {
          if (!inputGroupIds.includes(currentG.id)) {
            await tx.modifierGroup.update({
              where: { id: currentG.id },
              data: { deletedAt: new Date(), isActive: false },
            })
          }
        }

        // Upsert modifier groups
        for (const g of data.modifierGroups) {
          let groupId = g.id
          if (groupId) {
            await tx.modifierGroup.update({
              where: { id: groupId },
              data: {
                name: g.name,
                description: g.description || null,
                minSelect: g.minSelect !== undefined ? g.minSelect : 0,
                maxSelect: g.maxSelect !== undefined ? g.maxSelect : 1,
                isRequired: g.isRequired !== undefined ? g.isRequired : false,
                sortOrder: g.sortOrder || 0,
                isActive: g.isActive !== undefined ? g.isActive : true,
              },
            })
          } else {
            const createdGroup = await tx.modifierGroup.create({
              data: {
                productId: id,
                name: g.name,
                description: g.description || null,
                minSelect: g.minSelect !== undefined ? g.minSelect : 0,
                maxSelect: g.maxSelect !== undefined ? g.maxSelect : 1,
                isRequired: g.isRequired !== undefined ? g.isRequired : false,
                sortOrder: g.sortOrder || 0,
                isActive: g.isActive !== undefined ? g.isActive : true,
              },
            })
            groupId = createdGroup.id
          }

          // Manage options (modifiers) within group
          if (g.modifiers) {
            const currentModifiers = await tx.modifier.findMany({
              where: { modifierGroupId: groupId, deletedAt: null },
            })
            const inputModifierIds = g.modifiers.map((m: any) => m.id).filter(Boolean)

            // Delete modifiers not in input
            for (const currentM of currentModifiers) {
              if (!inputModifierIds.includes(currentM.id)) {
                await tx.modifier.update({
                  where: { id: currentM.id },
                  data: { deletedAt: new Date(), isActive: false },
                })
              }
            }

            // Upsert modifiers
            for (const m of g.modifiers) {
              if (m.id) {
                await tx.modifier.update({
                  where: { id: m.id },
                  data: {
                    name: m.name,
                    priceExtra: m.priceExtra !== undefined ? m.priceExtra : 0,
                    sortOrder: m.sortOrder || 0,
                    isActive: m.isActive !== undefined ? m.isActive : true,
                  },
                })
              } else {
                await tx.modifier.create({
                  data: {
                    modifierGroupId: groupId,
                    name: m.name,
                    priceExtra: m.priceExtra !== undefined ? m.priceExtra : 0,
                    sortOrder: m.sortOrder || 0,
                    isActive: m.isActive !== undefined ? m.isActive : true,
                  },
                })
              }
            }
          }
        }
      }

      // 4. Manage ingredients if provided
      if (data.ingredients) {
        // Delete all existing product ingredients for this product
        await tx.productIngredient.deleteMany({
          where: { productId: id },
        })

        // Create new associations
        for (const ing of data.ingredients) {
          await tx.productIngredient.create({
            data: {
              productId: id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              cost: ing.cost,
            },
          })
        }
      }

      // 5. Update Category mapping if defaultCategoryId is provided
      if (data.defaultCategoryId) {
        const defaultVariant = await tx.productVariant.findFirst({
          where: { productId: id, isDefault: true },
        })

        if (defaultVariant) {
          // Check if MenuItem exists
          const existingMI = await tx.menuItem.findFirst({
            where: { productVariantId: defaultVariant.id },
          })

          if (existingMI) {
            await tx.menuItem.update({
              where: { id: existingMI.id },
              data: {
                categoryId: data.defaultCategoryId,
                price:
                  data.basePrice !== undefined && data.basePrice !== null
                    ? data.basePrice
                    : existingMI.price,
                imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingMI.imageUrl,
              },
            })
          } else {
            await tx.menuItem.create({
              data: {
                categoryId: data.defaultCategoryId,
                productVariantId: defaultVariant.id,
                price: data.basePrice !== undefined && data.basePrice !== null ? data.basePrice : 0,
                isAvailable: true,
                isVisible: data.visibleByDefault !== undefined ? data.visibleByDefault : true,
                sortOrder: 0,
                imageUrl: data.imageUrl || null,
              },
            })
          }
        }
      }

      // Re-fetch product with all relations
      const fullProduct = await tx.product.findUnique({
        where: { id },
        include: {
          variants: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              menuItems: {
                include: {
                  category: true,
                },
              },
            },
          },
          modifierGroups: {
            where: { deletedAt: null },
            include: {
              modifiers: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          ingredients: {
            include: { ingredient: true },
          },
        },
      })

      return this.mapProductToDomain(fullProduct)
    })
  }

  async softDelete(id: string): Promise<void> {
    await db.$transaction(async (tx) => {
      const now = new Date()
      // Soft delete product
      await tx.product.update({
        where: { id },
        data: { deletedAt: now, isActive: false },
      })

      // Soft delete associated variants
      await tx.productVariant.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedAt: now, isActive: false },
      })

      // Soft delete associated modifier groups
      await tx.modifierGroup.updateMany({
        where: { productId: id, deletedAt: null },
        data: { deletedAt: now, isActive: false },
      })

      // Soft delete associated menu items
      const variants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      })
      const variantIds = variants.map((v) => v.id)

      await tx.menuItem.updateMany({
        where: { productVariantId: { in: variantIds }, deletedAt: null },
        data: { deletedAt: now, isAvailable: false, isVisible: false },
      })
    })
  }

  async restore(id: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Restore product
      await tx.product.update({
        where: { id },
        data: { deletedAt: null, isActive: true },
      })

      // Restore associated variants
      await tx.productVariant.updateMany({
        where: { productId: id, deletedAt: { not: null } },
        data: { deletedAt: null, isActive: true },
      })

      // Restore associated modifier groups
      await tx.modifierGroup.updateMany({
        where: { productId: id, deletedAt: { not: null } },
        data: { deletedAt: null, isActive: true },
      })

      // Restore associated menu items
      const variants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      })
      const variantIds = variants.map((v) => v.id)

      await tx.menuItem.updateMany({
        where: { productVariantId: { in: variantIds }, deletedAt: { not: null } },
        data: { deletedAt: null, isAvailable: true, isVisible: true },
      })
    })
  }

  async duplicate(id: string, newSku: string, newSlug: string): Promise<ProductWithFull> {
    const original = await this.findById(id, true)
    if (!original) throw new Error('Original product not found')

    return db.$transaction(async (tx) => {
      // 1. Create product clone
      const clonedProduct = await tx.product.create({
        data: {
          organizationId: original.organizationId,
          sku: newSku,
          slug: newSlug,
          name: `${original.name} (Copia)`,
          description: original.description,
          shortDescription: original.shortDescription,
          longDescription: original.longDescription,
          imageUrl: original.imageUrl,
          basePrice: original.basePrice !== null ? original.basePrice : null,
          cost: original.cost !== null ? original.cost : null,
          isAlcoholic: original.isAlcoholic,
          taxCategory: original.taxCategory,
          isActive: original.isActive,
          visibleByDefault: original.visibleByDefault,
          highlightedByDefault: original.highlightedByDefault,
          estimatedPrepTime: original.estimatedPrepTime,
          notes: original.notes,
          sortOrder: original.sortOrder,
          metadata: original.metadata as any,
        },
      })

      // 2. Clone variants
      const oldToNewVariantIds: Record<string, string> = {}
      for (const v of original.variants) {
        const clonedV = await tx.productVariant.create({
          data: {
            productId: clonedProduct.id,
            name: v.name,
            sku: v.isDefault ? newSku : v.sku ? `${v.sku}-COPY` : null,
            isDefault: v.isDefault,
            sortOrder: v.sortOrder,
            isActive: v.isActive,
          },
        })
        oldToNewVariantIds[v.id] = clonedV.id

        // Also duplicate MenuItem mappings for the default variant (if any exist)
        if (v.isDefault) {
          const originalMenuItems = await tx.menuItem.findMany({
            where: { productVariantId: v.id, deletedAt: null },
          })
          for (const mi of originalMenuItems) {
            await tx.menuItem.create({
              data: {
                categoryId: mi.categoryId,
                productVariantId: clonedV.id,
                price: mi.price,
                isAvailable: mi.isAvailable,
                isVisible: mi.isVisible,
                sortOrder: mi.sortOrder,
                imageUrl: mi.imageUrl,
              },
            })
          }
        }
      }

      // 3. Clone modifier groups and options
      for (const g of original.modifierGroups) {
        const clonedG = await tx.modifierGroup.create({
          data: {
            productId: clonedProduct.id,
            name: g.name,
            description: g.description,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            isRequired: g.isRequired,
            sortOrder: g.sortOrder,
            isActive: g.isActive,
          },
        })

        for (const m of g.modifiers) {
          await tx.modifier.create({
            data: {
              modifierGroupId: clonedG.id,
              name: m.name,
              priceExtra: m.priceExtra,
              sortOrder: m.sortOrder,
              isActive: m.isActive,
            },
          })
        }
      }

      // 4. Clone ingredients
      for (const ing of original.ingredients) {
        await tx.productIngredient.create({
          data: {
            productId: clonedProduct.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            cost: ing.cost,
          },
        })
      }

      // Re-fetch cloned product
      const fullClone = await tx.product.findUnique({
        where: { id: clonedProduct.id },
        include: {
          variants: {
            include: {
              menuItems: {
                include: {
                  category: true,
                },
              },
            },
          },
          modifierGroups: {
            include: { modifiers: true },
          },
          ingredients: {
            include: { ingredient: true },
          },
        },
      })

      return this.mapProductToDomain(fullClone)
    })
  }

  async createVersion(version: Omit<ProductVersion, 'id' | 'createdAt'>): Promise<ProductVersion> {
    const created = await db.productVersion.create({
      data: {
        productId: version.productId,
        versionNumber: version.versionNumber,
        userId: version.userId,
        changeReason: version.changeReason,
        productSnapshot: version.productSnapshot,
        variantsSnapshot: version.variantsSnapshot,
        modifiersSnapshot: version.modifiersSnapshot,
        ingredientsSnapshot: version.ingredientsSnapshot,
        pricesSnapshot: version.pricesSnapshot,
        configSnapshot: version.configSnapshot,
      },
    })

    return {
      id: created.id,
      productId: created.productId,
      versionNumber: created.versionNumber,
      createdAt: created.createdAt,
      userId: created.userId,
      changeReason: created.changeReason,
      productSnapshot: created.productSnapshot as Record<string, any>,
      variantsSnapshot: created.variantsSnapshot as Record<string, any>[],
      modifiersSnapshot: created.modifiersSnapshot as Record<string, any>[],
      ingredientsSnapshot: created.ingredientsSnapshot as Record<string, any>[],
      pricesSnapshot: created.pricesSnapshot as Record<string, any>,
      configSnapshot: created.configSnapshot as Record<string, any>,
    }
  }

  async findVersionsByProductId(productId: string): Promise<ProductVersion[]> {
    const list = await db.productVersion.findMany({
      where: { productId },
      orderBy: { versionNumber: 'desc' },
    })

    return list.map((v) => ({
      id: v.id,
      productId: v.productId,
      versionNumber: v.versionNumber,
      createdAt: v.createdAt,
      userId: v.userId,
      changeReason: v.changeReason,
      productSnapshot: v.productSnapshot as Record<string, any>,
      variantsSnapshot: v.variantsSnapshot as Record<string, any>[],
      modifiersSnapshot: v.modifiersSnapshot as Record<string, any>[],
      ingredientsSnapshot: v.ingredientsSnapshot as Record<string, any>[],
      pricesSnapshot: v.pricesSnapshot as Record<string, any>,
      configSnapshot: v.configSnapshot as Record<string, any>,
    }))
  }

  async createAuditLog(
    productId: string,
    event: string,
    details?: Record<string, any>,
    userId?: string
  ): Promise<CatalogAuditLog> {
    const created = await db.catalogAuditLog.create({
      data: {
        productId,
        event,
        details: details || {},
        userId: userId || null,
      },
    })

    return {
      id: created.id,
      productId: created.productId,
      event: created.event,
      details: created.details as Record<string, any> | null,
      userId: created.userId,
      createdAt: created.createdAt,
    }
  }

  async findAuditLogsByProductId(productId: string): Promise<CatalogAuditLog[]> {
    const list = await db.catalogAuditLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    })

    return list.map((l) => ({
      id: l.id,
      productId: l.productId,
      event: l.event,
      details: l.details as Record<string, any> | null,
      userId: l.userId,
      createdAt: l.createdAt,
    }))
  }

  async findCategories(organizationId: string): Promise<{ id: string; name: string }[]> {
    const categories = await db.category.findMany({
      where: {
        menu: {
          location: {
            organizationId,
          },
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      distinct: ['name'],
    })
    return categories
  }

  async findIngredients(organizationId: string): Promise<Ingredient[]> {
    const list = await db.ingredient.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    })
    return list.map((i) => ({
      id: i.id,
      organizationId: i.organizationId,
      name: i.name,
      unit: i.unit as any,
      isActive: i.isActive,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      deletedAt: i.deletedAt,
    }))
  }
}
