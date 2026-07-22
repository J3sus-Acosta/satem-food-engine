/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductCatalogService } from '@/services/catalog/ProductCatalogService'
import { ValidationError } from '@/lib/errors'
import type { IProductCatalogRepository } from '@/repositories/interfaces/IProductCatalogRepository'
import type { ProductWithFull, ProductVersion } from '@/types'

describe('ProductCatalogService', () => {
  let service: ProductCatalogService
  let mockRepo: any

  const fakeProduct: ProductWithFull = {
    id: 'prod-123',
    organizationId: 'org-1',
    sku: 'SKU-123',
    slug: 'prod-123',
    name: 'Café Expreso',
    description: 'Café expreso clásico',
    shortDescription: 'Expreso clásico',
    longDescription: 'Expreso clásico con granos seleccionados',
    imageUrl: '/images/products/coffee.webp',
    basePrice: 1500,
    cost: 500,
    isAlcoholic: false,
    taxCategory: 'STANDARD',
    isActive: true,
    visibleByDefault: true,
    highlightedByDefault: false,
    estimatedPrepTime: 5,
    notes: 'Servir caliente',
    sortOrder: 1,
    defaultCategoryId: 'cat-1',
    defaultCategoryName: 'Cafetería',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    variants: [
      {
        id: 'var-123',
        productId: 'prod-123',
        name: 'Estándar',
        sku: 'SKU-123',
        isDefault: true,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ],
    modifierGroups: [],
    ingredients: [],
  }

  const fakeVersion: ProductVersion = {
    id: 'ver-1',
    productId: 'prod-123',
    versionNumber: 1,
    createdAt: new Date(),
    userId: 'user-1',
    changeReason: 'Creación inicial',
    productSnapshot: {
      id: 'prod-123',
      organizationId: 'org-1',
      sku: 'SKU-123',
      slug: 'prod-123',
      name: 'Café Expreso Original',
      description: 'Café expreso clásico',
      imageUrl: '/images/products/coffee.webp',
    },
    variantsSnapshot: [],
    modifiersSnapshot: [],
    ingredientsSnapshot: [],
    pricesSnapshot: {
      basePrice: 1200,
      cost: 400,
      taxCategory: 'STANDARD',
    },
    configSnapshot: {
      isActive: true,
      visibleByDefault: true,
      highlightedByDefault: false,
      estimatedPrepTime: 5,
      notes: null,
      sortOrder: 0,
      metadata: {},
    },
  }

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findVersionById: vi.fn(),
      getLatestVersionNumber: vi.fn(),
      findProducts: vi.fn(),
      isSkuUnique: vi.fn(),
      isSlugUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      duplicate: vi.fn(),
      createVersion: vi.fn(),
      findVersionsByProductId: vi.fn(),
      createAuditLog: vi.fn(),
      findAuditLogsByProductId: vi.fn(),
      findCategories: vi.fn(),
    }

    service = new ProductCatalogService(mockRepo as IProductCatalogRepository)
  })

  describe('createProduct', () => {
    it('debe crear un producto correctamente con datos válidos', async () => {
      mockRepo.isSlugUnique.mockResolvedValue(true)
      mockRepo.isSkuUnique.mockResolvedValue(true)
      mockRepo.create.mockResolvedValue(fakeProduct)
      mockRepo.findById.mockResolvedValue(fakeProduct)
      mockRepo.getLatestVersionNumber.mockResolvedValue(0)

      const input = {
        organizationId: 'org-1',
        name: 'Café Expreso',
        sku: 'SKU-123',
        basePrice: 1500,
      }

      const result = await service.createProduct(input, 'user-1')

      expect(result).toEqual(fakeProduct)
      expect(mockRepo.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        name: 'Café Expreso',
        sku: 'SKU-123',
        slug: 'cafe-expreso',
        basePrice: 1500,
      })
      expect(mockRepo.createVersion).toHaveBeenCalled()
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith('prod-123', 'CREATED', {}, 'user-1')
    })

    it('debe lanzar ValidationError si el nombre está vacío', async () => {
      await expect(service.createProduct({ organizationId: 'org-1', name: '' })).rejects.toThrow(
        ValidationError
      )
    })

    it('debe lanzar ValidationError si el slug ya existe', async () => {
      mockRepo.isSlugUnique.mockResolvedValue(false) // slug tomado
      await expect(
        service.createProduct({ organizationId: 'org-1', name: 'Café' })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ValidationError si el SKU ya existe', async () => {
      mockRepo.isSlugUnique.mockResolvedValue(true)
      mockRepo.isSkuUnique.mockResolvedValue(false) // SKU tomado
      await expect(
        service.createProduct({ organizationId: 'org-1', name: 'Café', sku: 'SKU-DUP' })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('updateProduct', () => {
    it('debe guardar una versión snapshot antes de actualizar el producto', async () => {
      mockRepo.findById.mockResolvedValue(fakeProduct)
      mockRepo.getLatestVersionNumber.mockResolvedValue(1)
      mockRepo.update.mockResolvedValue({ ...fakeProduct, name: 'Expreso Modificado' })

      const result = await service.updateProduct(
        'prod-123',
        { name: 'Expreso Modificado' },
        'user-1',
        'Cambio de nombre'
      )

      expect(result.name).toBe('Expreso Modificado')
      // Debe haber guardado la versión 2
      expect(mockRepo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-123',
          versionNumber: 2,
          changeReason: 'Cambio de nombre',
          userId: 'user-1',
        })
      )
      expect(mockRepo.update).toHaveBeenCalledWith('prod-123', { name: 'Expreso Modificado' })
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        'prod-123',
        'UPDATED',
        { changeReason: 'Cambio de nombre' },
        'user-1'
      )
    })
  })

  describe('deleteProduct', () => {
    it('debe capturar un snapshot de versión antes de realizar softDelete', async () => {
      mockRepo.findById.mockResolvedValue(fakeProduct)
      mockRepo.getLatestVersionNumber.mockResolvedValue(1)

      await service.deleteProduct('prod-123', 'user-1')

      expect(mockRepo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-123',
          versionNumber: 2,
          changeReason: 'Eliminación lógica',
        })
      )
      expect(mockRepo.softDelete).toHaveBeenCalledWith('prod-123')
      expect(mockRepo.createAuditLog).toHaveBeenCalledWith('prod-123', 'DELETED', {}, 'user-1')
    })
  })

  describe('restoreProductVersion', () => {
    it('debe restaurar atributos a partir del snapshot e incrementar versión', async () => {
      mockRepo.findById.mockResolvedValue(fakeProduct)
      mockRepo.findVersionById.mockResolvedValue(fakeVersion)
      mockRepo.getLatestVersionNumber.mockResolvedValue(2)
      mockRepo.update.mockResolvedValue(fakeProduct) // mock de retorno

      await service.restoreProductVersion('prod-123', 'ver-1', 'user-1')

      // Debe haber guardado el estado actual como versión 3 antes de restaurar
      expect(mockRepo.createVersion).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-123',
          versionNumber: 3,
          changeReason: 'Restauración a la versión número 1',
        })
      )

      // Debe haber llamado a update con los valores del snapshot de la versión 1
      expect(mockRepo.update).toHaveBeenCalledWith(
        'prod-123',
        expect.objectContaining({
          name: 'Café Expreso Original',
          description: 'Café expreso clásico',
          basePrice: 1200,
          cost: 400,
        })
      )

      expect(mockRepo.createAuditLog).toHaveBeenCalledWith(
        'prod-123',
        'VERSION_RESTORED',
        { versionNumber: 1 },
        'user-1'
      )
    })
  })
})
