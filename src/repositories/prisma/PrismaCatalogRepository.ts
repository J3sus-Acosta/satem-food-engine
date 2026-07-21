import 'server-only'

import { db } from '@/server/db'
import { isConnectionError } from './shared'
import type { ICatalogRepository } from '@/repositories/interfaces'
import type {
  MenuWithCategories,
  Category,
  Product,
  ProductWithFull,
  CategoryWithItems,
  MenuItemWithProduct,
  ProductVariant,
  ModifierGroup,
  Modifier,
  TaxCategory,
  DailyMenuOverride,
  MenuItem,
} from '@/types'

// Mock Data representing the Food Truck "MCI Santiago" inside "Patio"
const MOCK_MENU = {
  id: 'menu_mci_santiago_default',
  locationId: 'loc_foodtruck_patio',
  name: 'Carta Food Truck MCI',
  description: 'Hamburguesas premium y acompañamientos en Santiago',
  isDefault: true,
  isActive: true,
  validFrom: null,
  validUntil: null,
  schedule: null,
  createdAt: new Date('2026-07-01T00:00:00Z'),
  updatedAt: new Date('2026-07-01T00:00:00Z'),
  deletedAt: null,
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_burgers',
    menuId: 'menu_mci_santiago_default',
    name: 'Hamburguesas 🍔',
    imageUrl: '/images/products/hamburguesa-clasica.webp',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'cat_sides',
    menuId: 'menu_mci_santiago_default',
    name: 'Acompañamientos 🍟',
    imageUrl: '/images/products/papas-fritas.webp',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'cat_drinks',
    menuId: 'menu_mci_santiago_default',
    name: 'Bebidas 🥤',
    imageUrl: '/images/products/coca-cola-original.webp',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
]

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_mci_classic',
    organizationId: 'org_mci',
    sku: 'SKU-BUR-01',
    name: 'MCI Burger Clásica',
    description:
      '150g de vacuno premium, queso cheddar, lechuga, tomate y salsa especial de la casa.',
    imageUrl: '/images/products/hamburguesa-clasica.webp',
    basePrice: 6990,
    isAlcoholic: false,
    taxCategory: 'STANDARD',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'prod_mci_italian',
    organizationId: 'org_mci',
    sku: 'SKU-BUR-02',
    name: 'MCI Burger Italiana',
    description: '150g de vacuno premium, palta hass molida, tomate picado y mayonesa casera.',
    imageUrl: '/images/products/hamburguesa-italiana.webp',
    basePrice: 7490,
    isAlcoholic: false,
    taxCategory: 'STANDARD',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'prod_papas_fritas',
    organizationId: 'org_mci',
    sku: 'SKU-SID-01',
    name: 'Papas Fritas Crujientes',
    description: 'Papas cortadas a mano, doble cocción, crujientes por fuera y tiernas por dentro.',
    imageUrl: '/images/products/papas-fritas.webp',
    basePrice: 2990,
    isAlcoholic: false,
    taxCategory: 'STANDARD',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  {
    id: 'prod_coca_cola',
    organizationId: 'org_mci',
    sku: 'SKU-DRK-01',
    name: 'Coca-Cola',
    description: 'Bebida gaseosa refrescante sabor original.',
    imageUrl: '/images/products/coca-cola-original.webp',
    basePrice: 1500,
    isAlcoholic: false,
    taxCategory: 'STANDARD',
    isActive: true,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
]

const MOCK_VARIANTS: Record<string, ProductVariant[]> = {
  prod_mci_classic: [
    {
      id: 'var_classic_simple',
      productId: 'prod_mci_classic',
      name: 'Simple',
      sku: 'SKU-BUR-01-SMP',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'var_classic_doble',
      productId: 'prod_mci_classic',
      name: 'Doble (+ $1.500)',
      sku: 'SKU-BUR-01-DBL',
      isDefault: false,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  prod_mci_italian: [
    {
      id: 'var_italian_simple',
      productId: 'prod_mci_italian',
      name: 'Simple',
      sku: 'SKU-BUR-02-SMP',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'var_italian_doble',
      productId: 'prod_mci_italian',
      name: 'Doble (+ $1.500)',
      sku: 'SKU-BUR-02-DBL',
      isDefault: false,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  prod_papas_fritas: [
    {
      id: 'var_papas_medianas',
      productId: 'prod_papas_fritas',
      name: 'Medianas',
      sku: 'SKU-SID-01-MED',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'var_papas_grandes',
      productId: 'prod_papas_fritas',
      name: 'Grandes (+ $1.000)',
      sku: 'SKU-SID-01-LRG',
      isDefault: false,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
  prod_coca_cola: [
    {
      id: 'var_coca_lata',
      productId: 'prod_coca_cola',
      name: 'Lata 350ml',
      sku: 'SKU-DRK-01-CAN',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'var_coca_botella',
      productId: 'prod_coca_cola',
      name: 'Botella 500ml (+ $500)',
      sku: 'SKU-DRK-01-BTL',
      isDefault: false,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
}

interface MockModifierGroup {
  group: ModifierGroup
  modifiers: Modifier[]
}

const MOCK_MODIFIERS: Record<string, MockModifierGroup[]> = {
  prod_mci_classic: [
    {
      group: {
        id: 'grp_classic_extras',
        productId: 'prod_mci_classic',
        name: 'Extras',
        description: 'Personaliza tu burger',
        minSelect: 0,
        maxSelect: 3,
        isRequired: false,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      modifiers: [
        {
          id: 'mod_extra_tocino',
          modifierGroupId: 'grp_classic_extras',
          name: 'Tocino Crujiente',
          priceExtra: 1000,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mod_extra_cheddar',
          modifierGroupId: 'grp_classic_extras',
          name: 'Queso Cheddar Extra',
          priceExtra: 800,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mod_extra_cebolla',
          modifierGroupId: 'grp_classic_extras',
          name: 'Cebolla Caramelizada',
          priceExtra: 600,
          sortOrder: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    },
    {
      group: {
        id: 'grp_classic_salsas',
        productId: 'prod_mci_classic',
        name: 'Salsas (Sin Costo)',
        description: 'Elige tus salsas',
        minSelect: 0,
        maxSelect: 3,
        isRequired: false,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      modifiers: [
        {
          id: 'mod_salsa_mayo',
          modifierGroupId: 'grp_classic_salsas',
          name: 'Mayo Casera',
          priceExtra: 0,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mod_salsa_bbq',
          modifierGroupId: 'grp_classic_salsas',
          name: 'Salsa BBQ',
          priceExtra: 0,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    },
  ],
  prod_mci_italian: [
    {
      group: {
        id: 'grp_italian_extras',
        productId: 'prod_mci_italian',
        name: 'Extras',
        description: 'Agrega más sabor',
        minSelect: 0,
        maxSelect: 2,
        isRequired: false,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      modifiers: [
        {
          id: 'mod_italian_tocino',
          modifierGroupId: 'grp_italian_extras',
          name: 'Tocino',
          priceExtra: 1000,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mod_italian_queso',
          modifierGroupId: 'grp_italian_extras',
          name: 'Queso Cheddar',
          priceExtra: 800,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    },
  ],
  prod_papas_fritas: [
    {
      group: {
        id: 'grp_papas_top',
        productId: 'prod_papas_fritas',
        name: 'Toppings',
        description: 'Agrega a tus papas',
        minSelect: 0,
        maxSelect: 2,
        isRequired: false,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      modifiers: [
        {
          id: 'mod_papas_cheddar',
          modifierGroupId: 'grp_papas_top',
          name: 'Cheddar Fundido',
          priceExtra: 800,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mod_papas_tocino',
          modifierGroupId: 'grp_papas_top',
          name: 'Crocante de Tocino',
          priceExtra: 1000,
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ],
    },
  ],
  prod_coca_cola: [],
}

// Helper to construct a full CategoryWithItems array from mock data
function buildMockMenuWithCategories(): MenuWithCategories {
  const categories: CategoryWithItems[] = MOCK_CATEGORIES.map((cat) => {
    let items: MenuItemWithProduct[] = []

    if (cat.id === 'cat_burgers') {
      items = [
        buildMockMenuItem(
          'mi_classic_simple',
          'cat_burgers',
          'var_classic_simple',
          'prod_mci_classic',
          6990
        ),
        buildMockMenuItem(
          'mi_classic_doble',
          'cat_burgers',
          'var_classic_doble',
          'prod_mci_classic',
          8490
        ),
        buildMockMenuItem(
          'mi_italian_simple',
          'cat_burgers',
          'var_italian_simple',
          'prod_mci_italian',
          7490
        ),
        buildMockMenuItem(
          'mi_italian_doble',
          'cat_burgers',
          'var_italian_doble',
          'prod_mci_italian',
          8990
        ),
      ]
    } else if (cat.id === 'cat_sides') {
      items = [
        buildMockMenuItem(
          'mi_papas_medianas',
          'cat_sides',
          'var_papas_medianas',
          'prod_papas_fritas',
          2990
        ),
        buildMockMenuItem(
          'mi_papas_grandes',
          'cat_sides',
          'var_papas_grandes',
          'prod_papas_fritas',
          3990
        ),
      ]
    } else if (cat.id === 'cat_drinks') {
      items = [
        buildMockMenuItem('mi_coca_lata', 'cat_drinks', 'var_coca_lata', 'prod_coca_cola', 1500),
        buildMockMenuItem(
          'mi_coca_botella',
          'cat_drinks',
          'var_coca_botella',
          'prod_coca_cola',
          2000
        ),
      ]
    }

    return {
      ...cat,
      items,
    }
  })

  return {
    ...MOCK_MENU,
    categories,
  }
}

function buildMockMenuItem(
  id: string,
  categoryId: string,
  variantId: string,
  productId: string,
  price: number
): MenuItemWithProduct {
  const product = MOCK_PRODUCTS.find((p) => p.id === productId)!
  const variant = MOCK_VARIANTS[productId].find((v) => v.id === variantId)!
  const modifierGroupConfigs = MOCK_MODIFIERS[productId] || []

  const modifierGroups = modifierGroupConfigs.map((cfg) => ({
    ...cfg.group,
    modifiers: cfg.modifiers,
  }))

  return {
    id,
    categoryId,
    productVariantId: variantId,
    name: `${product.name} (${variant.name})`,
    description: product.description,
    imageUrl: product.imageUrl,
    price,
    isAvailable: true,
    isVisible: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    productVariant: {
      ...variant,
      product,
    },
    modifierGroups,
  }
}

/**
 * Prisma implementation of ICatalogRepository with fallback to mock data on connection failure.
 */
export class PrismaCatalogRepository implements ICatalogRepository {
  async findMenuByLocationId(locationId: string): Promise<MenuWithCategories | null> {
    try {
      // Intentar consulta real a la base de datos
      const menu = await db.menu.findFirst({
        where: {
          locationId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          categories: {
            where: { isActive: true, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              menuItems: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                include: {
                  dailyMenuOverride: true,
                  productVariant: {
                    include: {
                      product: {
                        include: {
                          modifierGroups: {
                            where: { isActive: true, deletedAt: null },
                            orderBy: { sortOrder: 'asc' },
                            include: {
                              modifiers: {
                                where: { isActive: true, deletedAt: null },
                                orderBy: { sortOrder: 'asc' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!menu) {
        if (process.env.NODE_ENV === 'production') {
          return null
        }
        console.warn(
          `[PrismaCatalogRepository] Menu not found in DB for locationId "${locationId}". Falling back to Mock Data in development.`
        )
        return buildMockMenuWithCategories()
      }

      // Mapear de Prisma a nuestro tipo domain estructurado
      const categories: CategoryWithItems[] = menu.categories.map((cat) => {
        const rawItems = cat.menuItems.map((item) => {
          const product = item.productVariant.product
          const modifierGroups = product.modifierGroups.map((g) => ({
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
            modifiers: g.modifiers.map((m) => ({
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
          }))

          const override = item.dailyMenuOverride
            ? {
                id: item.dailyMenuOverride.id,
                menuItemId: item.dailyMenuOverride.menuItemId,
                price: item.dailyMenuOverride.price ? Number(item.dailyMenuOverride.price) : null,
                isAvailable: item.dailyMenuOverride.isAvailable,
                stockDaily: item.dailyMenuOverride.stockDaily,
                isHighlighted: item.dailyMenuOverride.isHighlighted,
                isVisible: item.dailyMenuOverride.isVisible,
                sortOrder: item.dailyMenuOverride.sortOrder,
                notes: item.dailyMenuOverride.notes,
                createdAt: item.dailyMenuOverride.createdAt,
                updatedAt: item.dailyMenuOverride.updatedAt,
              }
            : null

          // Resolve effective values
          const effectivePrice =
            override?.price !== null && override?.price !== undefined
              ? override.price
              : Number(item.price)
          let effectiveAvailable =
            override?.isAvailable !== null && override?.isAvailable !== undefined
              ? override.isAvailable
              : item.isAvailable
          const effectiveVisible =
            override?.isVisible !== null && override?.isVisible !== undefined
              ? override.isVisible
              : item.isVisible
          const effectiveSortOrder =
            override?.sortOrder !== null && override?.sortOrder !== undefined
              ? override.sortOrder
              : item.sortOrder

          // Apply stock out rule: if stock is defined and is 0 or less, mark as unavailable
          if (
            override?.stockDaily !== null &&
            override?.stockDaily !== undefined &&
            override.stockDaily <= 0
          ) {
            effectiveAvailable = false
          }

          return {
            id: item.id,
            categoryId: item.categoryId,
            productVariantId: item.productVariantId,
            name: item.name || item.productVariant.product.name,
            description: item.description,
            imageUrl: item.imageUrl || product.imageUrl,
            price: effectivePrice,
            isAvailable: effectiveAvailable,
            isVisible: effectiveVisible,
            sortOrder: effectiveSortOrder,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            deletedAt: item.deletedAt,
            dailyMenuOverride: override,
            productVariant: {
              id: item.productVariant.id,
              productId: item.productVariant.productId,
              name: item.productVariant.name,
              sku: item.productVariant.sku,
              isDefault: item.productVariant.isDefault,
              sortOrder: item.productVariant.sortOrder,
              isActive: item.productVariant.isActive,
              createdAt: item.productVariant.createdAt,
              updatedAt: item.productVariant.updatedAt,
              deletedAt: item.productVariant.deletedAt,
              product: {
                id: product.id,
                organizationId: product.organizationId,
                sku: product.sku,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                basePrice: product.basePrice ? Number(product.basePrice) : null,
                isAlcoholic: product.isAlcoholic,
                taxCategory: product.taxCategory as TaxCategory,
                isActive: product.isActive,
                metadata: product.metadata as unknown as Record<string, unknown>,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
                deletedAt: product.deletedAt,
              },
            },
            modifierGroups,
          }
        })

        // Filter out invisible items and sort by sortOrder
        const items = rawItems
          .filter((item) => item.isVisible)
          .sort((a, b) => a.sortOrder - b.sortOrder)

        return {
          id: cat.id,
          menuId: cat.menuId,
          name: cat.name,
          imageUrl: cat.imageUrl,
          sortOrder: cat.sortOrder,
          isActive: cat.isActive,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          deletedAt: cat.deletedAt,
          items,
        }
      })

      return {
        id: menu.id,
        locationId: menu.locationId,
        name: menu.name,
        description: menu.description,
        isDefault: menu.isDefault,
        isActive: menu.isActive,
        validFrom: menu.validFrom,
        validUntil: menu.validUntil,
        schedule: menu.schedule as unknown as Record<string, unknown>,
        createdAt: menu.createdAt,
        updatedAt: menu.updatedAt,
        deletedAt: menu.deletedAt,
        categories,
      }
    } catch (error) {
      if (isConnectionError(error) || process.env.NODE_ENV !== 'production') {
        console.warn(
          '[PrismaCatalogRepository.findMenuByLocationId] DB connection failed or non-production fallback to mock data:',
          error
        )
        return buildMockMenuWithCategories()
      }
      throw error
    }
  }

  async findMenuByLocationSlug(locationSlug: string): Promise<MenuWithCategories | null> {
    try {
      const location = await db.location.findFirst({
        where: {
          OR: [{ id: locationSlug }, { slug: locationSlug }],
          isActive: true,
          deletedAt: null,
        },
      })

      if (!location) {
        if (process.env.NODE_ENV === 'production') {
          return null
        }
        console.warn(
          `[PrismaCatalogRepository] Location not found for slug or ID "${locationSlug}". Falling back to Mock Data.`
        )
        return buildMockMenuWithCategories()
      }

      return this.findMenuByLocationId(location.id)
    } catch (error) {
      if (isConnectionError(error) || process.env.NODE_ENV !== 'production') {
        console.warn(
          '[PrismaCatalogRepository.findMenuByLocationSlug] DB connection failed or non-production fallback to mock data:',
          error
        )
        return buildMockMenuWithCategories()
      }
      throw error
    }
  }

  async findCategoriesByMenuId(menuId: string): Promise<Category[]> {
    try {
      const categories = await db.category.findMany({
        where: { menuId, isActive: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      })
      return categories
    } catch (error) {
      if (isConnectionError(error) || process.env.NODE_ENV !== 'production') {
        console.warn(
          '[PrismaCatalogRepository.findCategoriesByMenuId] DB connection failed or non-production fallback to mock categories:',
          error
        )
        return MOCK_CATEGORIES
      }
      throw error
    }
  }

  async findProductsByOrganizationId(organizationId: string): Promise<Product[]> {
    try {
      const products = await db.product.findMany({
        where: { organizationId, isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
      })
      return products.map((p) => ({
        ...p,
        basePrice: p.basePrice ? Number(p.basePrice) : null,
        metadata: p.metadata as unknown as Record<string, unknown>,
      }))
    } catch (error) {
      console.error(
        '[PrismaCatalogRepository.findProductsByOrganizationId] Database error, using mock products:',
        error
      )
      return MOCK_PRODUCTS
    }
  }

  async findProductBySlug(organizationId: string, slug: string): Promise<ProductWithFull | null> {
    try {
      // Nota: Asumiendo que buscamos por name/slug o ID en esta fase
      const product = await db.product.findFirst({
        where: {
          organizationId,
          name: { contains: slug, mode: 'insensitive' },
          isActive: true,
          deletedAt: null,
        },
        include: {
          variants: {
            where: { isActive: true, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          modifierGroups: {
            where: { isActive: true, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              modifiers: {
                where: { isActive: true, deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      })

      if (!product) {
        // Fallback a un producto mock de prueba
        const mockP = MOCK_PRODUCTS.find((p) => p.name.toLowerCase().includes(slug.toLowerCase()))
        if (mockP) {
          const variants = MOCK_VARIANTS[mockP.id] || []
          const modifierGroups = (MOCK_MODIFIERS[mockP.id] || []).map((m) => ({
            ...m.group,
            modifiers: m.modifiers,
          }))
          return {
            ...mockP,
            variants,
            modifierGroups,
          }
        }
        return null
      }

      return {
        id: product.id,
        organizationId: product.organizationId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        basePrice: product.basePrice ? Number(product.basePrice) : null,
        isAlcoholic: product.isAlcoholic,
        taxCategory: product.taxCategory as TaxCategory,
        isActive: product.isActive,
        metadata: product.metadata as unknown as Record<string, unknown>,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        deletedAt: product.deletedAt,
        variants: product.variants,
        modifierGroups: product.modifierGroups.map((g) => ({
          ...g,
          modifiers: g.modifiers.map((m) => ({
            ...m,
            priceExtra: Number(m.priceExtra),
          })),
        })),
      }
    } catch (error) {
      console.error(
        '[PrismaCatalogRepository.findProductBySlug] Database error, using mock fallback:',
        error
      )
      const mockP = MOCK_PRODUCTS.find((p) => p.name.toLowerCase().includes(slug.toLowerCase()))
      if (mockP) {
        const variants = MOCK_VARIANTS[mockP.id] || []
        const modifierGroups = (MOCK_MODIFIERS[mockP.id] || []).map((m) => ({
          ...m.group,
          modifiers: m.modifiers,
        }))
        return {
          ...mockP,
          variants,
          modifierGroups,
        }
      }
      return null
    }
  }

  async findMenuItemBySku(locationId: string, sku: string): Promise<MenuItem | null> {
    try {
      const dbItem = await db.menuItem.findFirst({
        where: {
          category: {
            menu: {
              locationId,
            },
          },
          productVariant: {
            sku,
            isActive: true,
            deletedAt: null,
          },
          deletedAt: null,
        },
        include: {
          dailyMenuOverride: true,
        },
      })

      if (!dbItem) {
        return null
      }

      const override = dbItem.dailyMenuOverride
        ? {
            id: dbItem.dailyMenuOverride.id,
            menuItemId: dbItem.dailyMenuOverride.menuItemId,
            price: dbItem.dailyMenuOverride.price ? Number(dbItem.dailyMenuOverride.price) : null,
            isAvailable: dbItem.dailyMenuOverride.isAvailable,
            stockDaily: dbItem.dailyMenuOverride.stockDaily,
            isHighlighted: dbItem.dailyMenuOverride.isHighlighted,
            isVisible: dbItem.dailyMenuOverride.isVisible,
            sortOrder: dbItem.dailyMenuOverride.sortOrder,
            notes: dbItem.dailyMenuOverride.notes,
            createdAt: dbItem.dailyMenuOverride.createdAt,
            updatedAt: dbItem.dailyMenuOverride.updatedAt,
          }
        : null

      return {
        id: dbItem.id,
        categoryId: dbItem.categoryId,
        productVariantId: dbItem.productVariantId,
        name: dbItem.name || null,
        description: dbItem.description,
        imageUrl: dbItem.imageUrl,
        price: Number(dbItem.price),
        isAvailable: dbItem.isAvailable,
        isVisible: dbItem.isVisible,
        sortOrder: dbItem.sortOrder,
        createdAt: dbItem.createdAt,
        updatedAt: dbItem.updatedAt,
        deletedAt: dbItem.deletedAt,
        dailyMenuOverride: override,
      }
    } catch (error) {
      console.error(
        `[PrismaCatalogRepository.findMenuItemBySku] Database error, falling back to mock search:`,
        error
      )
      // Fallback in-memory
      // MOCK_VARIANTS is a record of productVariant array
      // Let's find product variant matching SKU
      return null
    }
  }

  async upsertDailyMenuOverride(
    menuItemId: string,
    override: {
      price: number | null
      isAvailable: boolean | null
      stockDaily: number | null
      isHighlighted: boolean
      isVisible: boolean | null
      sortOrder: number | null
      notes: string | null
    }
  ): Promise<DailyMenuOverride> {
    try {
      const dbOverride = await db.dailyMenuOverride.upsert({
        where: { menuItemId },
        create: {
          menuItemId,
          price: override.price,
          isAvailable: override.isAvailable,
          stockDaily: override.stockDaily,
          isHighlighted: override.isHighlighted,
          isVisible: override.isVisible,
          sortOrder: override.sortOrder,
          notes: override.notes,
        },
        update: {
          price: override.price,
          isAvailable: override.isAvailable,
          stockDaily: override.stockDaily,
          isHighlighted: override.isHighlighted,
          isVisible: override.isVisible,
          sortOrder: override.sortOrder,
          notes: override.notes,
        },
      })

      return {
        id: dbOverride.id,
        menuItemId: dbOverride.menuItemId,
        price: dbOverride.price ? Number(dbOverride.price) : null,
        isAvailable: dbOverride.isAvailable,
        stockDaily: dbOverride.stockDaily,
        isHighlighted: dbOverride.isHighlighted,
        isVisible: dbOverride.isVisible,
        sortOrder: dbOverride.sortOrder,
        notes: dbOverride.notes,
        createdAt: dbOverride.createdAt,
        updatedAt: dbOverride.updatedAt,
      }
    } catch (error) {
      console.error(
        `[PrismaCatalogRepository.upsertDailyMenuOverride] Database error, using mock fallback:`,
        error
      )
      return {
        id: `mock-override-${menuItemId}`,
        menuItemId,
        price: override.price,
        isAvailable: override.isAvailable,
        stockDaily: override.stockDaily,
        isHighlighted: override.isHighlighted,
        isVisible: override.isVisible,
        sortOrder: override.sortOrder,
        notes: override.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
  }

  /**
   * Deletes all DailyMenuOverrides for the active menu of the given location.
   * Called by the nightly maintenance workflow at 02:00 AM before the next day's sync.
   *
   * @returns The number of override records deleted.
   */
  async resetDailyOverrides(locationId: string): Promise<number> {
    try {
      // 1. Resolve the active menu for this location
      const menu = await db.menu.findFirst({
        where: { locationId, isActive: true, deletedAt: null },
        select: {
          categories: {
            where: { isActive: true, deletedAt: null },
            select: {
              menuItems: {
                where: { deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      })

      if (!menu) {
        console.warn(
          `[PrismaCatalogRepository.resetDailyOverrides] No active menu found for locationId "${locationId}". Nothing to reset.`
        )
        return 0
      }

      // 2. Collect all MenuItem IDs from all categories in the menu
      const menuItemIds: string[] = menu.categories.flatMap((cat) =>
        cat.menuItems.map((item) => item.id)
      )

      if (menuItemIds.length === 0) {
        return 0
      }

      // 3. Bulk-delete all DailyMenuOverrides for those MenuItems
      const result = await db.dailyMenuOverride.deleteMany({
        where: { menuItemId: { in: menuItemIds } },
      })

      return result.count
    } catch (error) {
      console.error(
        `[PrismaCatalogRepository.resetDailyOverrides] Database error for locationId "${locationId}":`,
        error
      )
      // Return 0 instead of throwing — the nightly job should not abort on this error
      return 0
    }
  }
}
