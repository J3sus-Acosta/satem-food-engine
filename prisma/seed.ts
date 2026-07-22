import fs from 'fs'
import path from 'path'
import {
  PrismaClient,
  ChannelType,
  OrderStatus,
  PaymentStatus,
  KitchenTicketStatus,
  Customer,
  IngredientUnit,
  Product,
  ProductVariant,
} from '../src/generated/prisma'

const db = new PrismaClient()

async function main() {
  console.info('=== SATEM Food Engine: Iniciando carga de Seed Oficial ===')

  // 1. ORGANIZACIÓN
  console.info('1. Creando Organización Demo...')
  const org = await db.organization.upsert({
    where: { slug: 'satem-demo-restaurant' },
    update: {
      name: 'SATEM Demo Restaurant',
      plan: 'PRO',
      isActive: true,
    },
    create: {
      slug: 'satem-demo-restaurant',
      name: 'SATEM Demo Restaurant',
      plan: 'PRO',
      isActive: true,
    },
  })
  console.info(`✓ Organización: ${org.name} (ID: ${org.id})`)

  // 2. LOCALES
  console.info('2. Creando Locales...')
  const loc1 = await db.location.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'casa-matriz' } },
    update: { name: 'Casa Matriz', type: 'CAFETERIA', isActive: true },
    create: {
      organizationId: org.id,
      slug: 'casa-matriz',
      name: 'Casa Matriz',
      type: 'CAFETERIA',
      isActive: true,
      operatingHours: {},
      settings: {},
    },
  })

  const loc2 = await db.location.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'food-truck-patio' } },
    update: { name: 'Food Truck Patio', type: 'FOOD_TRUCK', isActive: true },
    create: {
      organizationId: org.id,
      slug: 'food-truck-patio',
      name: 'Food Truck Patio',
      type: 'FOOD_TRUCK',
      isActive: true,
      operatingHours: {},
      settings: {},
    },
  })
  console.info(`✓ Local 1: ${loc1.name} (ID: ${loc1.id})`)
  console.info(`✓ Local 2: ${loc2.name} (ID: ${loc2.id})`)

  // 3. USUARIOS (Personal Interno)
  console.info('3. Creando Usuarios y Asignaciones...')
  await db.user.upsert({
    where: { email: 'admin@satem.cl' },
    update: { name: 'Administrador Demo', role: 'ADMIN', isActive: true },
    create: {
      organizationId: org.id,
      email: 'admin@satem.cl',
      name: 'Administrador Demo',
      role: 'ADMIN',
      isActive: true,
    },
  })

  const userCashier = await db.user.upsert({
    where: { email: 'cajero@satem.cl' },
    update: { name: 'Cajero Demo', role: 'CASHIER', isActive: true },
    create: {
      organizationId: org.id,
      email: 'cajero@satem.cl',
      name: 'Cajero Demo',
      role: 'CASHIER',
      isActive: true,
    },
  })

  const userKitchen = await db.user.upsert({
    where: { email: 'cocinero@satem.cl' },
    update: { name: 'Cocinero Demo', role: 'KITCHEN', isActive: true },
    create: {
      organizationId: org.id,
      email: 'cocinero@satem.cl',
      name: 'Cocinero Demo',
      role: 'KITCHEN',
      isActive: true,
    },
  })

  // Asociar Cajero y Cocinero al Local 1 (Casa Matriz)
  await db.userLocation.upsert({
    where: { userId_locationId: { userId: userCashier.id, locationId: loc1.id } },
    update: {},
    create: { userId: userCashier.id, locationId: loc1.id },
  })

  await db.userLocation.upsert({
    where: { userId_locationId: { userId: userKitchen.id, locationId: loc1.id } },
    update: {},
    create: { userId: userKitchen.id, locationId: loc1.id },
  })
  console.info('✓ Usuarios y relaciones UserLocation creados con éxito')

  // 4. CANALES
  console.info('4. Creando Canales de Venta...')
  async function createChannelIfNotExist(locationId: string, type: ChannelType, name: string) {
    const existing = await db.channel.findFirst({
      where: { locationId, type, name },
    })
    if (existing) return existing
    return db.channel.create({
      data: { locationId, type, name, isActive: true, config: {} },
    })
  }

  const channelLoc1WEB = await createChannelIfNotExist(loc1.id, 'WEB', 'Mostrador Casa Matriz')
  const channelLoc1QR = await createChannelIfNotExist(loc1.id, 'QR', 'QR Mesa 1')
  const channelLoc1API = await createChannelIfNotExist(loc1.id, 'API', 'Delivery App')
  const channelLoc1WA = await createChannelIfNotExist(loc1.id, 'WHATSAPP', 'WhatsApp Bot')

  await createChannelIfNotExist(loc2.id, 'WEB', 'Mostrador Food Truck')
  await createChannelIfNotExist(loc2.id, 'QR', 'QR Mostrador Exterior')
  await createChannelIfNotExist(loc2.id, 'API', 'Delivery App Express')
  await createChannelIfNotExist(loc2.id, 'WHATSAPP', 'WhatsApp Bot Food Truck')
  console.info('✓ Canales de venta inicializados para ambos locales')

  // 5. MENÚS Y CATEGORÍAS
  console.info('5. Creando Menús y Categorías...')
  const menu1 =
    (await db.menu.findFirst({ where: { locationId: loc1.id, isDefault: true } })) ||
    (await db.menu.create({
      data: {
        locationId: loc1.id,
        name: 'Menú Casa Matriz',
        description: 'Carta principal de cafetería',
        isDefault: true,
        isActive: true,
      },
    }))

  const menu2 =
    (await db.menu.findFirst({ where: { locationId: loc2.id, isDefault: true } })) ||
    (await db.menu.create({
      data: {
        locationId: loc2.id,
        name: 'Menú Food Truck',
        description: 'Carta rápida para llevar',
        isDefault: true,
        isActive: true,
      },
    }))

  const categoryNames = [
    'Cafés',
    'Té',
    'Bebidas Frías',
    'Jugos',
    'Sandwiches',
    'Paninis',
    'Ensaladas',
    'Pastelería',
    'Postres',
    'Extras',
  ]

  const categoriesMenu1: Record<string, string> = {}
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i]
    const cat =
      (await db.category.findFirst({ where: { menuId: menu1.id, name } })) ||
      (await db.category.create({
        data: { menuId: menu1.id, name, sortOrder: i, isActive: true },
      }))
    categoriesMenu1[name] = cat.id
  }

  const categoriesMenu2: Record<string, string> = {}
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i]
    const cat =
      (await db.category.findFirst({ where: { menuId: menu2.id, name } })) ||
      (await db.category.create({
        data: { menuId: menu2.id, name, sortOrder: i, isActive: true },
      }))
    categoriesMenu2[name] = cat.id
  }
  console.info('✓ Menús y Categorías mapeadas con éxito')

  // 6. PRODUCTOS Y VARIANTES
  console.info('6. Creando Catálogo de Productos...')
  const productsData = [
    // Cafés
    {
      sku: 'SKU-CF-ESP',
      name: 'Espresso',
      description: 'Café espresso corto e intenso.',
      basePrice: 1990,
      categoryName: 'Cafés',
      imageUrl: '/images/products/espresso.webp',
    },
    {
      sku: 'SKU-CF-AME',
      name: 'Americano',
      description: 'Espresso diluido con agua caliente.',
      basePrice: 2290,
      categoryName: 'Cafés',
      imageUrl: '/images/products/americano.webp',
    },
    {
      sku: 'SKU-CF-LAT',
      name: 'Latte',
      description: 'Espresso con abundante leche emulsionada.',
      basePrice: 2890,
      categoryName: 'Cafés',
      imageUrl: '/images/products/latte.webp',
    },
    {
      sku: 'SKU-CF-CAP',
      name: 'Capuccino',
      description: 'Espresso, leche y espuma a partes iguales.',
      basePrice: 2890,
      categoryName: 'Cafés',
      imageUrl: '/images/products/capuccino.webp',
    },
    {
      sku: 'SKU-CF-MOC',
      name: 'Mocaccino',
      description: 'Café con chocolate y leche emulsionada.',
      basePrice: 3200,
      categoryName: 'Cafés',
      imageUrl: '/images/products/mocaccino.webp',
    },
    {
      sku: 'SKU-CF-CHO',
      name: 'Chocolate Caliente',
      description: 'Chocolate suizo derretido con leche.',
      basePrice: 2990,
      categoryName: 'Cafés',
      imageUrl: '/images/products/chocolate-caliente.webp',
    },

    // Té
    {
      sku: 'SKU-TE-VER',
      name: 'Té Verde Orgánico',
      description: 'Infusión de hojas de té verde seleccionadas.',
      basePrice: 1890,
      categoryName: 'Té',
      imageUrl: '/images/products/te-verde-organico.webp',
    },
    {
      sku: 'SKU-TE-NEG',
      name: 'Té Negro Earl Grey',
      description: 'Té negro con aroma de bergamota.',
      basePrice: 1890,
      categoryName: 'Té',
      imageUrl: '/images/products/te-negro-earl-grey.webp',
    },

    // Jugos
    {
      sku: 'SKU-JG-LIM',
      name: 'Limonada Menta Jengibre',
      description: 'Jugo natural de limón, menta fresca y jengibre.',
      basePrice: 2790,
      categoryName: 'Jugos',
      imageUrl: '/images/products/limonada-menta-jengibre.webp',
    },
    {
      sku: 'SKU-JG-NAR',
      name: 'Jugo Natural Naranja',
      description: 'Naranja 100% exprimida en el momento.',
      basePrice: 2990,
      categoryName: 'Jugos',
      imageUrl: '/images/products/jugo-natural-naranja.webp',
    },
    {
      sku: 'SKU-JG-FRA',
      name: 'Jugo Natural Frambuesa',
      description: 'Jugo de frambuesa fresca licuada.',
      basePrice: 3200,
      categoryName: 'Jugos',
      imageUrl: '/images/products/jugo-natural-frambuesa.webp',
    },

    // Bebidas Frías
    {
      sku: 'SKU-BF-AGS',
      name: 'Agua Mineral Sin Gas',
      description: 'Agua mineral de manantial.',
      basePrice: 1500,
      categoryName: 'Bebidas Frías',
      imageUrl: '/images/products/agua-mineral-sin-gas.webp',
    },
    {
      sku: 'SKU-BF-AGC',
      name: 'Agua Mineral Con Gas',
      description: 'Agua mineral gasificada.',
      basePrice: 1500,
      categoryName: 'Bebidas Frías',
      imageUrl: '/images/products/agua-mineral-con-gas.webp',
    },
    {
      sku: 'SKU-BF-COK',
      name: 'Coca-Cola Original',
      description: 'Lata de Coca-Cola original de 350ml.',
      basePrice: 1600,
      categoryName: 'Bebidas Frías',
      imageUrl: '/images/products/coca-cola-original.webp',
    },
    {
      sku: 'SKU-BF-COZ',
      name: 'Coca-Cola Zero',
      description: 'Lata de Coca-Cola Zero de 350ml.',
      basePrice: 1600,
      categoryName: 'Bebidas Frías',
      imageUrl: '/images/products/coca-cola-zero.webp',
    },

    // Sandwiches
    {
      sku: 'SKU-SD-CRO',
      name: 'Croissant Sencillo',
      description: 'Medialuna de mantequilla horneada.',
      basePrice: 1790,
      categoryName: 'Sandwiches',
      imageUrl: '/images/products/croissant-sencillo.webp',
    },
    {
      sku: 'SKU-SD-CRJ',
      name: 'Croissant Jamón Queso',
      description: 'Croissant relleno de jamón de pavo y queso cheddar caliente.',
      basePrice: 3290,
      categoryName: 'Sandwiches',
      imageUrl: '/images/products/croissant-jamon-queso.webp',
    },
    {
      sku: 'SKU-SD-ITA',
      name: 'Sandwich Ave Italiano',
      description:
        'Pollo desmenuzado, palta hass, tomate picado y mayonesa casera en pan de molde.',
      basePrice: 4290,
      categoryName: 'Sandwiches',
      imageUrl: '/images/products/sandwich-ave-italiano.webp',
    },
    {
      sku: 'SKU-SD-AVP',
      name: 'Sandwich Ave Palta',
      description: 'Pollo desmenuzado y abundante palta hass.',
      basePrice: 3990,
      categoryName: 'Sandwiches',
      imageUrl: '/images/products/sandwich-ave-palta.webp',
    },

    // Paninis
    {
      sku: 'SKU-PN-POL',
      name: 'Panini Pollo Pesto',
      description: 'Pechuga de pollo, queso mozzarella, tomate y salsa de pesto en pan ciabatta.',
      basePrice: 4500,
      categoryName: 'Paninis',
      imageUrl: '/images/products/panini-pollo-pesto.webp',
    },
    {
      sku: 'SKU-PN-JMQ',
      name: 'Panini Jamón Queso Mozzarella',
      description: 'Jamón pierna premium y abundante mozzarella derretido.',
      basePrice: 3990,
      categoryName: 'Paninis',
      imageUrl: '/images/products/panini-jamon-queso-mozzarella.webp',
    },

    // Ensaladas
    {
      sku: 'SKU-EN-CES',
      name: 'Ensalada César Pollo',
      description: 'Lechuga costina, pollo grillado, crutones, queso parmesano y aderezo césar.',
      basePrice: 4990,
      categoryName: 'Ensaladas',
      imageUrl: '/images/products/ensalada-cesar-pollo.webp',
    },
    {
      sku: 'SKU-EN-MED',
      name: 'Ensalada Mediterránea',
      description:
        'Mix de lechuga, tomate cherry, pepino, aceitunas negras, queso feta y vinagreta.',
      basePrice: 4690,
      categoryName: 'Ensaladas',
      imageUrl: '/images/products/ensalada-mediterranea.webp',
    },

    // Pastelería
    {
      sku: 'SKU-PT-BRO',
      name: 'Brownie Fudge Chocolate',
      description: 'Brownie húmedo de chocolate belga con nueces.',
      basePrice: 2200,
      categoryName: 'Pastelería',
      imageUrl: '/images/products/brownie-fudge-chocolate.webp',
    },
    {
      sku: 'SKU-PT-MUF',
      name: 'Muffin Arándano',
      description: 'Quequito esponjoso relleno de arándanos frescos.',
      basePrice: 1890,
      categoryName: 'Pastelería',
      imageUrl: '/images/products/muffin-arandano.webp',
    },
    {
      sku: 'SKU-PT-COO',
      name: 'Cookie Chips de Chocolate',
      description: 'Galleta casera con chispas de chocolate semi-amargo.',
      basePrice: 1200,
      categoryName: 'Pastelería',
      imageUrl: '/images/products/cookie-chips-de-chocolate.webp',
    },

    // Postres
    {
      sku: 'SKU-PS-CHE',
      name: 'Cheesecake Frambuesa',
      description: 'Tarta de queso crema horneada con salsa de frambuesas.',
      basePrice: 2990,
      categoryName: 'Postres',
      imageUrl: '/images/products/cheesecake-frambuesa.webp',
    },
  ]

  // Validar existencia de cada archivo de imagen antes de guardar en la DB
  console.info('   Verificando existencia física de imágenes del catálogo...')
  for (const p of productsData) {
    const relPath = p.imageUrl.startsWith('/') ? p.imageUrl.substring(1) : p.imageUrl
    const fullImgPath = path.join(process.cwd(), 'public', relPath)
    if (!fs.existsSync(fullImgPath)) {
      throw new Error(
        `[SEED ERROR] Falta la imagen para el producto "${p.name}" (${p.sku}). Archivo no encontrado: ${fullImgPath}`
      )
    }
  }
  console.info(
    '   ✓ Validación exitosa: Todos los productos cuentan con su archivo WebP correspondiente'
  )

  const mappedProducts: Record<string, { product: Product; variant: ProductVariant }> = {}

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  for (const pData of productsData) {
    const productSlug = slugify(pData.name)
    let product = await db.product.findFirst({
      where: { organizationId: org.id, sku: pData.sku },
    })
    if (!product) {
      product = await db.product.create({
        data: {
          organizationId: org.id,
          sku: pData.sku,
          slug: productSlug,
          name: pData.name,
          description: pData.description,
          basePrice: pData.basePrice,
          taxCategory: 'STANDARD',
          isActive: true,
          imageUrl: pData.imageUrl,
        },
      })
    } else {
      product = await db.product.update({
        where: { id: product.id },
        data: {
          name: pData.name,
          slug: productSlug,
          description: pData.description,
          basePrice: pData.basePrice,
          imageUrl: pData.imageUrl,
        },
      })
    }

    let variant = await db.productVariant.findFirst({ where: { productId: product.id } })
    if (!variant) {
      variant = await db.productVariant.create({
        data: {
          productId: product.id,
          name: 'Estándar',
          sku: pData.sku,
          isDefault: true,
          sortOrder: 0,
          isActive: true,
        },
      })
    }

    mappedProducts[pData.sku] = { product, variant }

    // MenuItem para Local 1
    const cat1Id = categoriesMenu1[pData.categoryName]
    const existingMI1 = await db.menuItem.findFirst({
      where: { categoryId: cat1Id, productVariantId: variant.id },
    })
    if (!existingMI1) {
      await db.menuItem.create({
        data: {
          categoryId: cat1Id,
          productVariantId: variant.id,
          price: pData.basePrice,
          isAvailable: true,
          isVisible: true,
          sortOrder: 0,
          imageUrl: pData.imageUrl,
        },
      })
    } else {
      await db.menuItem.update({
        where: { id: existingMI1.id },
        data: {
          imageUrl: pData.imageUrl,
          price: pData.basePrice,
        },
      })
    }

    // MenuItem para Local 2
    const cat2Id = categoriesMenu2[pData.categoryName]
    const existingMI2 = await db.menuItem.findFirst({
      where: { categoryId: cat2Id, productVariantId: variant.id },
    })
    if (!existingMI2) {
      await db.menuItem.create({
        data: {
          categoryId: cat2Id,
          productVariantId: variant.id,
          price: pData.basePrice,
          isAvailable: true,
          isVisible: true,
          sortOrder: 0,
          imageUrl: pData.imageUrl,
        },
      })
    } else {
      await db.menuItem.update({
        where: { id: existingMI2.id },
        data: {
          imageUrl: pData.imageUrl,
          price: pData.basePrice,
        },
      })
    }
  }
  console.info(`✓ Productos cargados exitosamente (${productsData.length} productos en catálogo)`)

  // 7. MODIFICADORES
  console.info('7. Creando Grupos de Modificadores y Opciones...')
  async function createModifierGroupAndModifiers(
    productId: string,
    groupName: string,
    minSelect: number,
    maxSelect: number,
    isRequired: boolean,
    options: Array<{ name: string; priceExtra: number; sortOrder: number }>
  ) {
    let group = await db.modifierGroup.findFirst({
      where: { productId, name: groupName },
    })
    if (!group) {
      group = await db.modifierGroup.create({
        data: {
          productId,
          name: groupName,
          minSelect,
          maxSelect,
          isRequired,
          sortOrder: 0,
          isActive: true,
        },
      })
    }

    for (const opt of options) {
      const existingOpt = await db.modifier.findFirst({
        where: { modifierGroupId: group.id, name: opt.name },
      })
      if (!existingOpt) {
        await db.modifier.create({
          data: {
            modifierGroupId: group.id,
            name: opt.name,
            priceExtra: opt.priceExtra,
            sortOrder: opt.sortOrder,
            isActive: true,
          },
        })
      }
    }
  }

  // Asignar modificadores a cafés
  const cafeSkus = [
    'SKU-CF-ESP',
    'SKU-CF-AME',
    'SKU-CF-LAT',
    'SKU-CF-CAP',
    'SKU-CF-MOC',
    'SKU-CF-CHO',
  ]
  for (const sku of cafeSkus) {
    const productInfo = mappedProducts[sku]
    if (!productInfo) continue

    // 1. Tamaño
    await createModifierGroupAndModifiers(productInfo.product.id, 'Tamaño', 1, 1, true, [
      { name: 'Pequeño', priceExtra: 0, sortOrder: 0 },
      { name: 'Mediano', priceExtra: 500, sortOrder: 1 },
      { name: 'Grande', priceExtra: 1000, sortOrder: 2 },
    ])

    // 2. Tipo de Leche (solo para cafés que lleven leche: Latte, Capuccino, Mocaccino, Chocolate)
    if (['SKU-CF-LAT', 'SKU-CF-CAP', 'SKU-CF-MOC', 'SKU-CF-CHO'].includes(sku)) {
      await createModifierGroupAndModifiers(productInfo.product.id, 'Tipo de Leche', 1, 1, true, [
        { name: 'Normal', priceExtra: 0, sortOrder: 0 },
        { name: 'Deslactosada', priceExtra: 0, sortOrder: 1 },
        { name: 'Avena', priceExtra: 500, sortOrder: 2 },
        { name: 'Almendra', priceExtra: 500, sortOrder: 3 },
      ])
    }

    // 3. Endulzante
    await createModifierGroupAndModifiers(productInfo.product.id, 'Endulzante', 1, 2, false, [
      { name: 'Sin Azúcar', priceExtra: 0, sortOrder: 0 },
      { name: 'Azúcar Tradicional', priceExtra: 0, sortOrder: 1 },
      { name: 'Stevia', priceExtra: 0, sortOrder: 2 },
      { name: 'Sucralosa', priceExtra: 0, sortOrder: 3 },
    ])

    // 4. Extras
    await createModifierGroupAndModifiers(productInfo.product.id, 'Extras', 0, 3, false, [
      { name: 'Shot Espresso Extra', priceExtra: 800, sortOrder: 0 },
      { name: 'Crema Batida', priceExtra: 600, sortOrder: 1 },
      { name: 'Salsa Chocolate', priceExtra: 500, sortOrder: 2 },
      { name: 'Salsa Caramelo', priceExtra: 500, sortOrder: 3 },
    ])
  }

  // Modificadores de Té
  const teSkus = ['SKU-TE-VER', 'SKU-TE-NEG']
  for (const sku of teSkus) {
    const productInfo = mappedProducts[sku]
    if (!productInfo) continue

    await createModifierGroupAndModifiers(productInfo.product.id, 'Endulzante', 1, 2, false, [
      { name: 'Sin Azúcar', priceExtra: 0, sortOrder: 0 },
      { name: 'Miel de Abeja', priceExtra: 400, sortOrder: 1 },
      { name: 'Stevia', priceExtra: 0, sortOrder: 2 },
    ])
  }

  // Modificadores de Jugos
  const jugoSkus = ['SKU-JG-LIM', 'SKU-JG-NAR', 'SKU-JG-FRA']
  for (const sku of jugoSkus) {
    const productInfo = mappedProducts[sku]
    if (!productInfo) continue

    await createModifierGroupAndModifiers(productInfo.product.id, 'Endulzante', 1, 1, true, [
      { name: 'Sin Endulzar', priceExtra: 0, sortOrder: 0 },
      { name: 'Azúcar', priceExtra: 0, sortOrder: 1 },
      { name: 'Stevia', priceExtra: 0, sortOrder: 2 },
    ])
  }
  console.info('✓ Grupos de modificadores asignados a las categorías correspondientes')

  // 8. INGREDIENTES E INVENTARIO
  console.info('8. Creando Insumos y Niveles de Stock...')
  const ingredientsData = [
    { name: 'Café Grano', unit: 'KG' },
    { name: 'Leche Entera', unit: 'L' },
    { name: 'Leche Avena', unit: 'L' },
    { name: 'Leche Almendra', unit: 'L' },
    { name: 'Pan Ciabatta', unit: 'UNITS' },
    { name: 'Pan de Molde', unit: 'UNITS' },
    { name: 'Croissant Masa', unit: 'UNITS' },
    { name: 'Jamón de Pavo', unit: 'KG' },
    { name: 'Queso Cheddar', unit: 'KG' },
    { name: 'Queso Mozzarella', unit: 'KG' },
    { name: 'Queso Feta', unit: 'KG' },
    { name: 'Queso Parmesano', unit: 'KG' },
    { name: 'Pechuga de Pollo', unit: 'KG' },
    { name: 'Palta Hass', unit: 'KG' },
    { name: 'Tomate Cherry', unit: 'KG' },
    { name: 'Lechuga Costina', unit: 'KG' },
    { name: 'Chocolate Jarabe', unit: 'KG' },
    { name: 'Azúcar Granulada', unit: 'KG' },
    { name: 'Endulzante Stevia', unit: 'UNITS' },
  ]

  for (const ing of ingredientsData) {
    let dbIng = await db.ingredient.findFirst({
      where: { organizationId: org.id, name: ing.name },
    })
    if (!dbIng) {
      dbIng = await db.ingredient.create({
        data: {
          organizationId: org.id,
          name: ing.name,
          unit: ing.unit as IngredientUnit,
          isActive: true,
        },
      })
    }

    // Nivel Stock Local 1
    await db.inventoryItem.upsert({
      where: { locationId_ingredientId: { locationId: loc1.id, ingredientId: dbIng.id } },
      update: { quantity: 150, minQuantity: 15 },
      create: {
        locationId: loc1.id,
        ingredientId: dbIng.id,
        quantity: 150,
        minQuantity: 15,
      },
    })

    // Nivel Stock Local 2
    await db.inventoryItem.upsert({
      where: { locationId_ingredientId: { locationId: loc2.id, ingredientId: dbIng.id } },
      update: { quantity: 80, minQuantity: 8 },
      create: {
        locationId: loc2.id,
        ingredientId: dbIng.id,
        quantity: 80,
        minQuantity: 8,
      },
    })
  }
  console.info('✓ Tabla de insumos de inventario y stock inicial de locales configurados')

  // 9. DAILY MENU OVERRIDES (Menú del día activo)
  console.info('9. Configurando Disponibilidad y Stock Diario del Menú...')
  const menuItems = await db.menuItem.findMany({
    where: {
      category: {
        menu: {
          locationId: { in: [loc1.id, loc2.id] },
        },
      },
    },
  })

  for (const mi of menuItems) {
    await db.dailyMenuOverride.upsert({
      where: { menuItemId: mi.id },
      update: {
        isAvailable: true,
        isVisible: true,
        stockDaily: 50,
        isHighlighted: false,
      },
      create: {
        menuItemId: mi.id,
        isAvailable: true,
        isVisible: true,
        stockDaily: 50,
        isHighlighted: false,
      },
    })
  }
  console.info('✓ Menú activo cargado e indexado para el día actual')

  // 10. CLIENTES DEMO
  console.info('10. Creando Clientes...')
  const customersData = [
    { phone: '+56911112222', email: 'juan.perez@gmail.com', name: 'Juan Pérez' },
    { phone: '+56922223333', email: 'maria.g@gmail.com', name: 'María González' },
    { phone: '+56933334444', email: 'carlos.rojas@gmail.com', name: 'Carlos Rojas' },
    { phone: '+56944445555', email: 'ana.silva@outlook.com', name: 'Ana Silva' },
    { phone: '+56955556666', email: 'diego.m@hotmail.com', name: 'Diego Muñoz' },
  ]

  const customers: Customer[] = []
  for (const cust of customersData) {
    const dbCust = await db.customer.upsert({
      where: { organizationId_phone: { organizationId: org.id, phone: cust.phone } },
      update: { name: cust.name, email: cust.email },
      create: {
        organizationId: org.id,
        phone: cust.phone,
        email: cust.email,
        name: cust.name,
      },
    })
    customers.push(dbCust)
  }
  console.info('✓ 5 clientes de demostración creados')

  // 11. PEDIDOS HISTÓRICOS, PAGOS Y KITCHEN TICKETS
  console.info('11. Creando Pedidos de Prueba, Transacciones de Pago y Comandas...')

  // Limpiar pedidos anteriores con números de orden específicos del seed
  const seedOrderNumbers = [
    '#SEED01',
    '#SEED02',
    '#SEED03',
    '#SEED04',
    '#SEED05',
    '#SEED06',
    '#SEED07',
    '#SEED08',
  ]

  await db.orderItemModifier.deleteMany({
    where: { orderItem: { order: { orderNumber: { in: seedOrderNumbers } } } },
  })
  await db.kitchenTicketItem.deleteMany({
    where: { kitchenTicket: { order: { orderNumber: { in: seedOrderNumbers } } } },
  })
  await db.kitchenTicket.deleteMany({
    where: { order: { orderNumber: { in: seedOrderNumbers } } },
  })
  await db.payment.deleteMany({
    where: { order: { orderNumber: { in: seedOrderNumbers } } },
  })
  await db.stockMovement.deleteMany({
    where: { order: { orderNumber: { in: seedOrderNumbers } } },
  })
  await db.orderItem.deleteMany({
    where: { order: { orderNumber: { in: seedOrderNumbers } } },
  })
  await db.order.deleteMany({
    where: { orderNumber: { in: seedOrderNumbers } },
  })

  // Helper para buscar los MenuItem por SKU
  async function getMenuItemDetails(sku: string, locationId: string) {
    const dbItem = await db.menuItem.findFirst({
      where: {
        category: {
          menu: { locationId },
        },
        productVariant: { sku },
      },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                modifierGroups: {
                  include: { modifiers: true },
                },
              },
            },
          },
        },
      },
    })
    if (!dbItem) throw new Error(`MenuItem no encontrado para SKU: ${sku} en Local: ${locationId}`)
    return dbItem
  }

  // Helper completo para poblar pedidos con snapshots
  async function seedOrder(
    locationId: string,
    channelId: string,
    customerId: string | null,
    orderNumber: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    itemsInput: Array<{
      sku: string
      quantity: number
      modifiersInput?: Array<{ groupName: string; modifierName: string }>
    }>
  ) {
    const orderItemsData: Array<{
      menuItemId: string
      productVariantId: string
      name: string
      unitPrice: number
      quantity: number
      subtotal: number
      modifiers: Array<{ modifierId: string; name: string; priceExtra: number }>
    }> = []
    let totalOrderAmount = 0

    for (const input of itemsInput) {
      const mi = await getMenuItemDetails(input.sku, locationId)
      const unitPrice = Number(mi.price)
      let priceExtraSum = 0
      const modifiersData: Array<{ modifierId: string; name: string; priceExtra: number }> = []

      if (input.modifiersInput) {
        for (const modIn of input.modifiersInput) {
          const group = mi.productVariant.product.modifierGroups.find(
            (g) => g.name === modIn.groupName
          )
          if (group) {
            const mod = group.modifiers.find((m) => m.name === modIn.modifierName)
            if (mod) {
              priceExtraSum += Number(mod.priceExtra)
              modifiersData.push({
                modifierId: mod.id,
                name: mod.name,
                priceExtra: Number(mod.priceExtra),
              })
            }
          }
        }
      }

      const itemSubtotal = (unitPrice + priceExtraSum) * input.quantity
      totalOrderAmount += itemSubtotal

      orderItemsData.push({
        menuItemId: mi.id,
        productVariantId: mi.productVariantId,
        name: mi.productVariant.product.name,
        unitPrice,
        quantity: input.quantity,
        subtotal: itemSubtotal,
        modifiers: modifiersData,
      })
    }

    // Crear el Pedido
    const order = await db.order.create({
      data: {
        orderNumber,
        locationId,
        customerId,
        channelId,
        status,
        type: 'TAKEAWAY',
        subtotal: totalOrderAmount,
        totalAmount: totalOrderAmount,
        taxAmount: totalOrderAmount * 0.19,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Crear OrderItems y OrderItemModifiers
    for (const item of orderItemsData) {
      const dbItem = await db.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          productVariantId: item.productVariantId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        },
      })

      for (const mod of item.modifiers) {
        await db.orderItemModifier.create({
          data: {
            orderItemId: dbItem.id,
            modifierId: mod.modifierId,
            name: mod.name,
            priceExtra: mod.priceExtra,
          },
        })
      }
    }

    // Crear Transacción de Pago
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: 'SUMUP',
        status: paymentStatus,
        amount: totalOrderAmount,
        currency: 'CLP',
        externalId: paymentStatus === 'PAID' ? `tx_sumup_${orderNumber}` : null,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
      },
    })

    // Crear KitchenTicket
    let ticketStatus: KitchenTicketStatus = 'PENDING'
    if (status === 'DELIVERED' || status === 'READY') {
      ticketStatus = 'DONE'
    } else if (status === 'PREPARING') {
      ticketStatus = 'IN_PROGRESS'
    }

    const ticket = await db.kitchenTicket.create({
      data: {
        orderId: order.id,
        status: ticketStatus,
        startedAt:
          status === 'PREPARING' || status === 'READY' || status === 'DELIVERED'
            ? new Date()
            : null,
        completedAt: status === 'READY' || status === 'DELIVERED' ? new Date() : null,
      },
    })

    // Crear KitchenTicketItems
    const orderItemsCreated = await db.orderItem.findMany({ where: { orderId: order.id } })
    for (const oItem of orderItemsCreated) {
      await db.kitchenTicketItem.create({
        data: {
          kitchenTicketId: ticket.id,
          orderItemId: oItem.id,
          quantity: oItem.quantity,
        },
      })
    }

    return order
  }

  // Pedido 1: COMPLETED (DELIVERED) — Juan Pérez
  await seedOrder(loc1.id, channelLoc1WEB.id, customers[0].id, '#SEED01', 'DELIVERED', 'PAID', [
    { sku: 'SKU-CF-ESP', quantity: 2 },
    { sku: 'SKU-SD-CRJ', quantity: 1 },
  ])

  // Pedido 2: COMPLETED (DELIVERED) — María González
  await seedOrder(loc1.id, channelLoc1QR.id, customers[1].id, '#SEED02', 'DELIVERED', 'PAID', [
    {
      sku: 'SKU-CF-LAT',
      quantity: 1,
      modifiersInput: [
        { groupName: 'Tamaño', modifierName: 'Mediano' },
        { groupName: 'Tipo de Leche', modifierName: 'Avena' },
      ],
    },
    { sku: 'SKU-PT-MUF', quantity: 1 },
  ])

  // Pedido 3: COMPLETED (DELIVERED) — Carlos Rojas
  await seedOrder(loc1.id, channelLoc1API.id, customers[2].id, '#SEED03', 'DELIVERED', 'PAID', [
    { sku: 'SKU-PN-POL', quantity: 1 },
    { sku: 'SKU-JG-LIM', quantity: 1 },
  ])

  // Pedido 4: READY — Ana Silva
  await seedOrder(loc1.id, channelLoc1WEB.id, customers[3].id, '#SEED04', 'READY', 'PAID', [
    {
      sku: 'SKU-CF-CAP',
      quantity: 1,
      modifiersInput: [
        { groupName: 'Tamaño', modifierName: 'Mediano' },
        { groupName: 'Tipo de Leche', modifierName: 'Almendra' },
      ],
    },
    { sku: 'SKU-PT-BRO', quantity: 1 },
  ])

  // Pedido 5: READY — Diego Muñoz
  await seedOrder(loc1.id, channelLoc1API.id, customers[4].id, '#SEED05', 'READY', 'PAID', [
    { sku: 'SKU-SD-ITA', quantity: 1 },
    { sku: 'SKU-BF-COZ', quantity: 1 },
  ])

  // Pedido 6: PREPARING — Guest (Sin Customer ID)
  await seedOrder(loc1.id, channelLoc1WEB.id, null, '#SEED06', 'PREPARING', 'PAID', [
    {
      sku: 'SKU-CF-AME',
      quantity: 2,
      modifiersInput: [{ groupName: 'Tamaño', modifierName: 'Grande' }],
    },
    { sku: 'SKU-SD-CRO', quantity: 2 },
  ])

  // Pedido 7: CONFIRMED — Juan Pérez (Pago Pendiente)
  await seedOrder(loc1.id, channelLoc1WA.id, customers[0].id, '#SEED07', 'CONFIRMED', 'PENDING', [
    { sku: 'SKU-EN-CES', quantity: 1 },
    { sku: 'SKU-BF-AGS', quantity: 1 },
  ])

  // Pedido 8: CONFIRMED — María González (Pago Rechazado/Fallido)
  await seedOrder(loc1.id, channelLoc1QR.id, customers[1].id, '#SEED08', 'CONFIRMED', 'FAILED', [
    { sku: 'SKU-PN-JMQ', quantity: 1 },
    { sku: 'SKU-JG-NAR', quantity: 1 },
  ])
  console.info(
    '✓ 8 pedidos históricos con estados mezclados, tickets de cocina y transacciones de pago creados'
  )

  // 11.5 INITIALIZE ORDER SEQUENCE FOR DEMO LOCATIONS
  console.info('11.5 Inicializando OrderSequence para las sucursales demo...')
  const todayBusinessDate = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')

  await db.orderSequence.upsert({
    where: {
      locationId_businessDate: {
        locationId: loc1.id,
        businessDate: todayBusinessDate,
      },
    },
    update: {
      lastNumber: 8,
    },
    create: {
      locationId: loc1.id,
      businessDate: todayBusinessDate,
      lastNumber: 8,
    },
  })

  await db.orderSequence.upsert({
    where: {
      locationId_businessDate: {
        locationId: loc2.id,
        businessDate: todayBusinessDate,
      },
    },
    update: {
      lastNumber: 0,
    },
    create: {
      locationId: loc2.id,
      businessDate: todayBusinessDate,
      lastNumber: 0,
    },
  })
  console.info('✓ OrderSequence configurado (loc1.lastNumber = 8, loc2.lastNumber = 0)')

  // 12. MENSAJES Y CONVERSACIONES (WhatsApp Chat Session)
  console.info('12. Inicializando Conversaciones WhatsApp Demo...')
  const whatsappSession = await db.channelSession.upsert({
    where: {
      channelId_externalId: { channelId: channelLoc1WA.id, externalId: 'session_demo_juan' },
    },
    update: { customerId: customers[0].id, status: 'ACTIVE' },
    create: {
      channelId: channelLoc1WA.id,
      customerId: customers[0].id,
      externalId: 'session_demo_juan',
      status: 'ACTIVE',
      context: { step: 'welcome' },
    },
  })

  // Purga mensajes previos del seed para evitar duplicación
  await db.message.deleteMany({ where: { channelSessionId: whatsappSession.id } })

  await db.message.createMany({
    data: [
      {
        channelSessionId: whatsappSession.id,
        role: 'USER',
        content: 'Hola, me gustaría hacer un pedido para retirar.',
        type: 'TEXT',
      },
      {
        channelSessionId: whatsappSession.id,
        role: 'ASSISTANT',
        content: '¡Hola, Juan! Bienvenido a SATEM Demo Restaurant. ¿Qué te gustaría pedir hoy?',
        type: 'TEXT',
      },
      {
        channelSessionId: whatsappSession.id,
        role: 'USER',
        content: 'Quiero una Ensalada César con Pollo y un agua mineral sin gas.',
        type: 'TEXT',
      },
      {
        channelSessionId: whatsappSession.id,
        role: 'ASSISTANT',
        content:
          'Perfecto. Agregado: 1 Ensalada César con Pollo y 1 Agua Mineral Sin Gas. Tu total es de $6.490. ¿Confirmas tu pedido?',
        type: 'TEXT',
      },
      {
        channelSessionId: whatsappSession.id,
        role: 'USER',
        content: 'Sí, confirmado.',
        type: 'TEXT',
      },
    ],
  })
  console.info('✓ Chat de WhatsApp cargado en base de datos para Juan Pérez')

  console.info('=== SATEM Food Engine: Carga de Seed Completada con Éxito ===')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error al ejecutar el seed:', e)
    await db.$disconnect()
    process.exit(1)
  })
