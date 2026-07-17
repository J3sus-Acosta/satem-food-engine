# CMS Google Sheets — Diseño de Modelo de Datos

Este documento define la estructura y diseño de las hojas de cálculo de Google Sheets que servirán como **CMS inicial** para que el administrador del restaurante gestione el catálogo, disponibilidad, inventario inicial y configuraciones.

Posteriormente, un flujo en **n8n** leerá estas hojas y sincronizará la información directamente con la base de datos **PostgreSQL**.

---

## Estructura de Hojas de Cálculo

El libro de Google Sheets debe contener las siguientes **6 hojas**:

1. `Categorías`
2. `Productos`
3. `Variantes`
4. `Modificadores_Grupos`
5. `Modificadores`
6. `Configuración`

---

### 1. Hoja: `Categorías`

Define las secciones del menú donde se agrupan los productos (ej. Entradas, Platos de Fondo, Bebidas).

| Columna     | Tipo         | Descripción                                        | Ejemplo / Reglas                          |
| ----------- | ------------ | -------------------------------------------------- | ----------------------------------------- |
| `id`        | Texto / CUID | Identificador único de la categoría.               | `cat_123` o vacío (n8n autogenerará CUID) |
| `name`      | Texto        | Nombre de la categoría mostrado al público.        | `Hamburguesas`, `Bebidas`                 |
| `imageUrl`  | Texto (URL)  | Imagen representativa de la categoría.             | `https://satem.store/images/burgers.jpg`  |
| `sortOrder` | Entero       | Orden visual en la carta (menor valor va primero). | `10`, `20`, `30`                          |
| `isActive`  | Booleano     | Si la categoría está visible en el menú.           | `VERDADERO`, `FALSO`                      |

---

### 2. Hoja: `Productos`

Define los productos base en el catálogo global de la organización.

| Columna       | Tipo         | Descripción                                        | Ejemplo / Reglas                                    |
| ------------- | ------------ | -------------------------------------------------- | --------------------------------------------------- |
| `id`          | Texto / CUID | Identificador único del producto.                  | `prod_burger_classic`                               |
| `sku`         | Texto        | Código interno de stock.                           | `SKU-BUR-01`                                        |
| `name`        | Texto        | Nombre del producto.                               | `Hamburguesa Italiana`                              |
| `description` | Texto        | Descripción de ingredientes o preparación.         | `Hamburguesa de vacuno, tomate, palta, mayo casera` |
| `imageUrl`    | Texto (URL)  | Fotografía del producto.                           | `https://satem.store/images/burger-italiana.jpg`    |
| `basePrice`   | Decimal      | Precio base sugerido (opcional).                   | `6990`                                              |
| `isAlcoholic` | Booleano     | Indica si tiene alcohol (para control de venta).   | `VERDADERO`, `FALSO`                                |
| `taxCategory` | Texto        | Categoría tributaria del producto.                 | `STANDARD`, `EXEMPT`, `REDUCED`                     |
| `isActive`    | Booleano     | Si el producto está activo en el catálogo general. | `VERDADERO`, `FALSO`                                |

---

### 3. Hoja: `Variantes`

Define las diferentes presentaciones que puede tener un producto (ej. tamaño, ingredientes adicionales).
Cada producto debe tener **al menos una variante** (ej. la versión "Simple" o "Individual").

| Columna        | Tipo         | Descripción                                                     | Ejemplo / Reglas                                                  |
| -------------- | ------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`           | Texto / CUID | Identificador único de la variante.                             | `var_italiana_double`                                             |
| `productId`    | Texto / CUID | ID del producto padre al que pertenece.                         | `prod_burger_classic` (debe coincidir con la hoja Productos)      |
| `name`         | Texto        | Nombre de la variante.                                          | `Doble Carne`, `Individual`, `Familiar`                           |
| `sku`          | Texto        | SKU específico de la variante.                                  | `SKU-BUR-01-DBL`                                                  |
| `price`        | Decimal      | **Precio de venta efectivo** para esta variante en la sucursal. | `8990`                                                            |
| `isDefault`    | Booleano     | Si es la variante seleccionada por defecto.                     | `VERDADERO` (solo una variante por producto puede ser VERDADERO)  |
| `categoryName` | Texto        | Categoría a la que se asocia visualmente en el menú.            | `Hamburguesas` (sirve para construir el `MenuItem` en `Category`) |
| `sortOrder`    | Entero       | Orden visual dentro de las variantes del producto.              | `1`, `2`, `3`                                                     |
| `isActive`     | Booleano     | Si la variante está activa para ser vendida.                    | `VERDADERO`, `FALSO`                                              |
| `isAvailable`  | Booleano     | Disponibilidad de stock actual en el local.                     | `VERDADERO`, `FALSO` (se mapea a `MenuItem.isAvailable`)          |

---

### 4. Hoja: `Modificadores_Grupos`

Agrupaciones de opciones o agregados para un producto (ej. "Elige tu salsa", "Agrega extras").

| Columna       | Tipo         | Descripción                                              | Ejemplo / Reglas                                 |
| ------------- | ------------ | -------------------------------------------------------- | ------------------------------------------------ |
| `id`          | Texto / CUID | Identificador del grupo de modificadores.                | `grp_salsas`                                     |
| `productId`   | Texto / CUID | ID del producto que posee este grupo de agregados.       | `prod_burger_classic`                            |
| `name`        | Texto        | Nombre del grupo visible al cliente.                     | `Salsas`, `Agregados Extra`                      |
| `description` | Texto        | Instrucción o descripción corta.                         | `Selecciona hasta 3 salsas gratis`               |
| `minSelect`   | Entero       | Mínimo de opciones que el cliente debe elegir.           | `0` (opcional), `1` (obligatorio)                |
| `maxSelect`   | Entero       | Máximo de opciones que el cliente puede elegir.          | `1` (radio buttons), `3` (checkboxes con límite) |
| `sortOrder`   | Entero       | Orden visual del grupo dentro de la página del producto. | `1`, `2`                                         |
| `isActive`    | Booleano     | Si el grupo está activo y visible.                       | `VERDADERO`, `FALSO`                             |

---

### 5. Hoja: `Modificadores`

Las opciones individuales asociadas a un grupo de modificadores (ej. Ketchup, Queso Cheddar Extra).

| Columna           | Tipo         | Descripción                                           | Ejemplo / Reglas                                                |
| ----------------- | ------------ | ----------------------------------------------------- | --------------------------------------------------------------- |
| `id`              | Texto / CUID | Identificador del modificador.                        | `mod_cheddar`                                                   |
| `modifierGroupId` | Texto / CUID | ID del grupo de modificadores al que pertenece.       | `grp_agregados_extra` (debe coincidir con Modificadores_Grupos) |
| `name`            | Texto        | Nombre del agregado.                                  | `Queso Cheddar Extra`, `Mayo Casera`                            |
| `priceExtra`      | Decimal      | Cargo adicional al precio base al elegir esta opción. | `1000`, `0`                                                     |
| `sortOrder`       | Entero       | Orden dentro del grupo.                               | `1`, `2`                                                        |
| `isActive`        | Booleano     | Si la opción está activa y seleccionable.             | `VERDADERO`, `FALSO`                                            |

---

### 6. Hoja: `Configuración`

Valores generales y operacionales del restaurante o local.

| Columna       | Tipo  | Descripción                                        | Ejemplo / Reglas                               |
| ------------- | ----- | -------------------------------------------------- | ---------------------------------------------- |
| `key`         | Texto | Clave única de la configuración.                   | `RESTAURANT_NAME`, `TAX_RATE`, `ALLOW_TIPS`    |
| `value`       | Texto | Valor asignado.                                    | `Food Truck MCI Santiago`, `0.19`, `VERDADERO` |
| `description` | Texto | Nota explicativa sobre para qué sirve la variable. | `Nombre mostrado al tope de la carta digital`  |

---

## Reglas de Integración con n8n

1. **Idempotencia:** n8n utilizará la columna `id` de cada hoja como clave primaria. Si el ID ya existe en PostgreSQL, realizará un _UPDATE_ de los campos. Si no existe, creará un _INSERT_ y subirá el nuevo ID generado al Google Sheet.
2. **Eliminaciones (Soft Delete):** Cuando una fila sea marcada como `isActive = FALSO` en Google Sheets, n8n actualizará la base de datos marcando el registro como inactivo, o con `deletedAt = timestamp` actual para evitar romper registros históricos de pedidos (`Orders`).
3. **Validación de Relaciones:** n8n validará que no existan variantes o grupos de modificadores huérfanos. Por ejemplo, si un producto no existe en `Productos`, sus variantes en `Variantes` no serán sincronizadas.
