/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProductService } from '@/services/products'
import { ValidationError } from '@/lib/errors'
import { adaptSheetRowsToDomain, type SheetRow } from '@/services/menu-sync'
import type { ICatalogRepository, IProductRepository } from '@/repositories'
import type { MenuItem } from '@/types'

describe('Menú Diario - Servicios de Dominio', () => {
  let productService: ProductService
  let mockCatalogRepo: any
  let mockProductRepo: any

  beforeEach(() => {
    mockCatalogRepo = {
      findMenuByLocationId: vi.fn(),
      findMenuByLocationSlug: vi.fn(),
      findCategoriesByMenuId: vi.fn(),
      findProductsByOrganizationId: vi.fn(),
      findProductBySlug: vi.fn(),
      findMenuItemBySku: vi.fn(),
      upsertDailyMenuOverride: vi.fn(),
    }

    mockProductRepo = {
      findByIdWithFull: vi.fn(),
      findByOrganizationId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      createVariant: vi.fn(),
      setDefaultVariant: vi.fn(),
    }

    productService = new ProductService(
      mockProductRepo as IProductRepository,
      mockCatalogRepo as ICatalogRepository
    )
  })

  describe('previewDailyMenuOverrides', () => {
    it('debe generar una vista previa correcta con un payload válido', async () => {
      // Mock de MenuItem maestro
      const fakeMenuItem: MenuItem = {
        id: 'menu-item-1',
        categoryId: 'cat-1',
        productVariantId: 'variant-1',
        name: 'Hamburguesa Simple',
        description: 'Hamburguesa con queso',
        imageUrl: null,
        price: 5000,
        isAvailable: true,
        isVisible: true,
        sortOrder: 1,
        dailyMenuOverride: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      mockCatalogRepo.findMenuItemBySku.mockResolvedValue(fakeMenuItem)

      const rows = [
        {
          Código: 'BUR001',
          Disponible: 'SI',
          Visible: 'SI',
          Precio: 4500,
          Stock: 15,
          Destacado: 'SI',
          Orden: 3,
          Nota: 'En oferta hoy',
        },
      ]

      const preview = await productService.previewDailyMenuOverrides('loc-123', rows)

      expect(preview).toHaveLength(1)
      expect(preview[0].code).toBe('BUR001')
      expect(preview[0].name).toBe('Hamburguesa Simple')
      expect(preview[0].before.price).toBe(5000)
      expect(preview[0].before.isAvailable).toBe(true)
      expect(preview[0].after.price).toBe(4500)
      expect(preview[0].after.isAvailable).toBe(true)
      expect(preview[0].after.stockDaily).toBe(15)
      expect(preview[0].after.isHighlighted).toBe(true)
      expect(preview[0].after.sortOrder).toBe(3)
      expect(preview[0].after.notes).toBe('En oferta hoy')
    })

    it('debe fallar si el código de producto no existe en el local', async () => {
      mockCatalogRepo.findMenuItemBySku.mockResolvedValue(null) // no existe

      const rows = [
        {
          Código: 'BUR999',
          Disponible: 'SI',
          Visible: 'SI',
          Precio: 4500,
          Stock: 15,
          Destacado: 'NO',
          Orden: 1,
          Nota: '',
        },
      ]

      await expect(productService.previewDailyMenuOverrides('loc-123', rows)).rejects.toThrow(
        ValidationError
      )

      try {
        await productService.previewDailyMenuOverrides('loc-123', rows)
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toContain("Código 'BUR999' no existe en este local")
      }
    })

    it('debe fallar si el precio o el stock son inválidos (negativos)', async () => {
      const fakeMenuItem: MenuItem = {
        id: 'menu-item-1',
        categoryId: 'cat-1',
        productVariantId: 'variant-1',
        name: 'Hamburguesa Simple',
        description: 'Hamburguesa con queso',
        imageUrl: null,
        price: 5000,
        isAvailable: true,
        isVisible: true,
        sortOrder: 1,
        dailyMenuOverride: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }

      mockCatalogRepo.findMenuItemBySku.mockResolvedValue(fakeMenuItem)

      const rowsConPrecioNegativo = [
        {
          Código: 'BUR001',
          Disponible: 'SI',
          Visible: 'SI',
          Precio: -500, // inválido
          Stock: 15,
          Destacado: 'NO',
          Orden: 1,
          Nota: '',
        },
      ]

      await expect(
        productService.previewDailyMenuOverrides('loc-123', rowsConPrecioNegativo)
      ).rejects.toThrow(ValidationError)

      const rowsConStockNegativo = [
        {
          Código: 'BUR001',
          Disponible: 'SI',
          Visible: 'SI',
          Precio: 5000,
          Stock: -2, // inválido
          Destacado: 'NO',
          Orden: 1,
          Nota: '',
        },
      ]

      await expect(
        productService.previewDailyMenuOverrides('loc-123', rowsConStockNegativo)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('Conversión de Sheets a Dominio (menu-sync helper)', () => {
    it('debe mapear correctamente los campos y normalizar booleanos', () => {
      const rawSheetRows: SheetRow[] = [
        {
          Código: '  BUR001 ',
          Disponible: 'si',
          Visible: 'no',
          Precio: '4500',
          Stock: '20',
          Destacado: 'SI',
          Orden: '3',
          Nota: '  Nota de prueba  ',
        },
      ]

      const adapted = adaptSheetRowsToDomain(rawSheetRows)

      expect(adapted).toHaveLength(1)
      expect(adapted[0].Código).toBe('BUR001')
      expect(adapted[0].Disponible).toBe('SI')
      expect(adapted[0].Visible).toBe('NO')
      expect(adapted[0].Precio).toBe('4500')
      expect(adapted[0].Stock).toBe('20')
      expect(adapted[0].Destacado).toBe('SI')
      expect(adapted[0].Orden).toBe('3')
      expect(adapted[0].Nota).toBe('Nota de prueba')
    })
  })
})
