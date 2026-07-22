# Módulo de Catálogo Maestro de Productos (Fase 10B)

El Catálogo Maestro de Productos de SATEM Food Engine es la fuente de verdad única para la definición estructural de los productos de la organización.

A diferencia del **Menú Diario** (`/dashboard/menu`), que es puramente operacional y gestiona disponibilidad diaria, precio diario y stock del día, el **Catálogo Maestro** (`/dashboard/catalog`) administra los atributos estructurales permanentes.

---

## Arquitectura y Flujo de Datos

El catálogo maestro está diseñado bajo principios de Clean Architecture:

```
Componentes React (CatalogDashboardClient.tsx)
             ↓
     API Routes (app/api/catalog/products/route.ts)
             ↓
     ProductCatalogService.ts (Lógica de negocio, control de versiones)
             ↓
     PrismaProductCatalogRepository.ts (Acceso a base de datos relacional)
             ↓
       Base de Datos (PostgreSQL via Prisma)
```

### Reglas Clave de Negocio

1. **Sin lógica en componentes ni API routes**: Toda la orquestación e integridad del negocio (como validación de SKU/Slug únicos) ocurre en `ProductCatalogService`.
2. **Imágenes Locales**: Las imágenes de productos se almacenan exclusivamente en el sistema de archivos local (`public/images/products/`) a través de un endpoint dedicado que sanitiza el nombre de archivo. No se admiten URLs externas para evitar roturas de enlaces.

---

## Formulario de Edición por Pestañas

Para evitar la sobrecarga cognitiva en la gestión de un producto complejo con múltiples relaciones, el panel de administración implementa un formulario unificado estructurado en pestañas:

1. **Información Básica**: Nombre, SKU técnico, Slug autogenerado, descripción comercial, descripción de comanda e imagen local.
2. **Operación y Precios**: Precio base por defecto, costo de receta, IVA / categoría de impuestos, tiempo estimado de preparación, habilitación en catálogo, destaque y marcas de producto (como advertencia de alcohol).
3. **Variantes**: Gestión de variaciones extras (ej: tamaño Grande, Mediano) adicionales a la variante &ldquo;Estándar&rdquo; creada automáticamente.
4. **Modificadores**: Creación de grupos de opciones (ej: &ldquo;Elige tu salsa&rdquo;) y asignación de precios adicionales para opciones de acompañamiento.
5. **Insumos y Receta**: Asociación técnica a materias primas o insumos de inventario, definiendo la cantidad requerida por unidad de venta para el descuento automatizado de stock.
