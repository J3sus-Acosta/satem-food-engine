# Catálogo Oficial de Imágenes — SATEM Food Engine

Este documento define la arquitectura, convenciones, flujo de trabajo y reglas operativas para la gestión de imágenes de productos dentro del **SATEM Food Engine**.

---

## 1. Objetivo y Principio de Portabilidad

El sistema utiliza exclusivamente **imágenes locales almacenadas dentro del repositorio**.

- Se prohíbe el uso de URLs remotas (Unsplash, CDNs externos, etc.) para garantizar la disponibilidad offline, evitar fallos por conectividad y mantener el control de activos gráficos.
- Todas las imágenes son estáticas y servidas localmente por Next.js desde `public/images/products/`.

---

## 2. Estructura de Directorios

```
public/
└── images/
    └── products/
        ├── espresso.webp
        ├── americano.webp
        ├── latte.webp
        ├── capuccino.webp
        ├── mocaccino.webp
        ├── chocolate-caliente.webp
        ├── te-verde-organico.webp
        ├── te-negro-earl-grey.webp
        ├── limonada-menta-jengibre.webp
        ├── jugo-natural-naranja.webp
        ├── jugo-natural-frambuesa.webp
        ├── agua-mineral-sin-gas.webp
        ├── agua-mineral-con-gas.webp
        ├── coca-cola-original.webp
        ├── coca-cola-zero.webp
        ├── croissant-sencillo.webp
        ├── croissant-jamon-queso.webp
        ├── sandwich-ave-italiano.webp
        ├── sandwich-ave-palta.webp
        ├── panini-pollo-pesto.webp
        ├── panini-jamon-queso-mozzarella.webp
        ├── ensalada-cesar-pollo.webp
        ├── ensalada-mediterranea.webp
        ├── brownie-fudge-chocolate.webp
        ├── muffin-arandano.webp
        ├── cookie-chips-de-chocolate.webp
        └── cheesecake-frambuesa.webp
```

---

## 3. Nomenclatura y Formato

### Formato Estándar

- **Formato:** WebP (`.webp`)
- **Resolución:** `1024x1024` píxeles (relación de aspecto 1:1)
- **Compresión:** Calidad alta (85-90%)

### Convención de Nombres (Nomenclatura Slug)

Los nombres de archivos deben coincidir en minúsculas separadas por guiones (`kebab-case`) con el slug identificador del producto:

$$\text{Ruta} = \text{/images/products/\{\$slug\}.webp}$$

**Ejemplos:**

- Producto `Espresso` $\rightarrow$ `/images/products/espresso.webp`
- Producto `Croissant Jamón Queso` $\rightarrow$ `/images/products/croissant-jamon-queso.webp`
- Producto `Té Verde Orgánico` $\rightarrow$ `/images/products/te-verde-organico.webp`

---

## 4. Estilo Visual Uniforme

Para mantener una estética profesional y consistente en la carta digital y terminales POS:

1. **Estilo:** Fotografía gastronómica hiperrealista en estudio.
2. **Superficie:** Mesa de madera clara con textura natural.
3. **Perspectiva:** Plano picado a 45° focalizado en el producto.
4. **Iluminación:** Luz natural difusa con sombras suaves de contacto.
5. **Prohibiciones:** Sin textos, sin logotipos, sin marcas registradas, sin personas ni manos visibles.

---

## 5. Cómo Reemplazar una Imagen Existente

1. Prepara o genera la nueva fotografía en `1024x1024` píxeles en formato `.webp`.
2. Reemplaza el archivo correspondiente en `public/images/products/[slug].webp`.
3. Ejecuta la verificación automática:
   ```bash
   npm run verify:images
   ```

---

## 6. Cómo Agregar un Nuevo Producto al Catálogo

1. Asigna un slug único al producto (ej: `empanada-pino`).
2. Guarda la imagen en `public/images/products/empanada-pino.webp`.
3. En `prisma/seed.ts` (o en la base de datos), registra el producto asignando la propiedad `imageUrl`:
   ```ts
   imageUrl: '/images/products/empanada-pino.webp'
   ```
4. Ejecuta el script de verificación para validar que no existan referencias rotas ni archivos huérfanos:
   ```bash
   npm run verify:images
   ```

---

## 7. Verificación de Integridad

El proyecto incluye un script de auditoría automatizada que valida:

- Existencia física de cada imagen registrada en la base de datos o seed.
- Inexistencia de imágenes huérfanas en el sistema de archivos.

Ejecución:

```bash
npm run verify:images
```
