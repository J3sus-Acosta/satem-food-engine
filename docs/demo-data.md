# Modelo de Datos Demo (Seed Oficial) — SATEM Food Engine

Este documento detalla el dataset profesional provisto por el archivo de semilla oficial (`prisma/seed.ts`). Este conjunto de datos representa el catálogo, inventario y operaciones de una cafetería/restaurante de especialidad real.

---

## 1. Tenancy e Infraestructura Base

### Organización

- **Nombre**: `SATEM Demo Restaurant`
- **Slug**: `satem-demo-restaurant`
- **Plan**: `PRO` (Permite multi-sucursal, KDS avanzado, múltiples integraciones)

### Locales

1. **Casa Matriz** (Tipo: `CAFETERIA`, Slug: `casa-matriz`)
2. **Food Truck Patio** (Tipo: `FOOD_TRUCK`, Slug: `food-truck-patio`)

---

## 2. Personal Interno (Usuarios)

Se cargan 3 usuarios con roles específicos para simular las operaciones del restaurante:

1. **Administrador** (`admin@satem.cl`): Rol `ADMIN`. Acceso total.
2. **Cajero** (`cajero@satem.cl`): Rol `CASHIER`. Vinculado a `Casa Matriz`.
3. **Cocinero** (`cocinero@satem.cl`): Rol `KITCHEN`. Vinculado a `Casa Matriz`.

---

## 3. Canales de Origen de Pedidos

Se crean 4 canales de venta activos para cada uno de los dos locales (total de 8 canales en el sistema):

- **Mostrador** (Tipo: `WEB`): Ventas presenciales en caja.
- **QR Mesa** (Tipo: `QR`): Carta digital para mesas de salón.
- **Delivery App** (Tipo: `API`): Pedidos ingresados desde plataformas integradas.
- **WhatsApp Bot** (Tipo: `WHATSAPP`): Pedidos recibidos a través del chatbot conversacional.

---

## 4. Catálogo y Menú Activo

### Categorías (10 en total)

`Cafés`, `Té`, `Bebidas Frías`, `Jugos`, `Sandwiches`, `Paninis`, `Ensaladas`, `Pastelería`, `Postres`, `Extras`.

### Productos (27 productos profesionales)

El seed genera 27 productos reales con sus descripciones, precios base e imágenes representativas de Unsplash:

- **Cafés**: Espresso ($1.990), Americano ($2.290), Latte ($2.890), Capuccino ($2.890), Mocaccino ($3.200), Chocolate Caliente ($2.990).
- **Té**: Té Verde Orgánico ($1.890), Té Negro Earl Grey ($1.890).
- **Jugos**: Limonada Menta Jengibre ($2.790), Jugo Natural Naranja ($2.990), Jugo Natural Frambuesa ($3.200).
- **Bebidas Frías**: Agua Mineral Sin Gas ($1.500), Agua Mineral Con Gas ($1.500), Coca-Cola Original ($1.600), Coca-Cola Zero ($1.600).
- **Sandwiches**: Croissant Sencillo ($1.790), Croissant Jamón Queso ($3.290), Sandwich Ave Italiano ($4.290), Sandwich Ave Palta ($3.990).
- **Paninis**: Panini Pollo Pesto ($4.500), Panini Jamón Queso Mozzarella ($3.990).
- **Ensaladas**: Ensalada César Pollo ($4.990), Ensalada Mediterránea ($4.690).
- **Pastelería**: Brownie Fudge Chocolate ($2.200), Muffin Arándano ($1.890), Cookie Chips de Chocolate ($1.200).
- **Postres**: Cheesecake Frambuesa ($2.990).

---

## 5. Grupos de Modificadores (Acompañamientos)

Se configuran reglas dinámicas asociadas a los productos del menú:

### Cafés:

- **Tamaño** (Obligatorio, selecciona 1): Pequeño ($0), Mediano (+$500), Grande (+$1.000).
- **Tipo de Leche** (Obligatorio en cafés con leche, selecciona 1): Entera ($0), Deslactosada ($0), Avena (+$500), Almendra (+$500).
- **Endulzante** (Opcional, selecciona hasta 2): Sin azúcar ($0), Azúcar ($0), Stevia ($0), Sucralosa ($0).
- **Extras** (Opcional, selecciona hasta 3): Shot Espresso Extra (+$800), Crema Batida (+$600), Salsa Chocolate (+$500), Salsa Caramelo (+$500).

### Tés y Jugos:

- **Endulzante** (Obligatorio en jugos, opcional en té): Selección de edulcorantes o Miel de Abeja (+$400).

---

## 6. Control de Stock e Inventario

### Insumos (19 ingredientes base)

Se crean insumos reales tales como: `Café Grano`, `Leche Entera`, `Leche Avena`, `Leche Almendra`, `Pan Ciabatta`, `Jamón de Pavo`, `Queso Mozzarella`, `Palta Hass`, `Tomate Cherry`, `Lechuga Costina`, etc.

### Stock Inicial

Para todos los ingredientes se crean registros de `InventoryItem` para ambos locales:

- **Casa Matriz**: Cantidad inicial = 150 unidades, cantidad mínima de alerta = 15.
- **Food Truck Patio**: Cantidad inicial = 80 unidades, cantidad mínima de alerta = 8.

### Menú Diario (Overrides)

Todos los productos se enlazan mediante `DailyMenuOverride` para el día actual, asegurando un stock de **50 porciones diarias** disponibles para la venta.

---

## 7. Clientes y Pedidos Históricos (Flujo Operativo)

### Clientes (5 Clientes demo creados)

- Juan Pérez (`+56911112222`)
- María González (`+56922223333`)
- Carlos Rojas (`+56933334444`)
- Ana Silva (`+56944445555`)
- Diego Muñoz (`+56955556666`)

### Historial de Pedidos (8 Órdenes con IDs `#SEED01` a `#SEED08`)

Para reflejar el flujo KDS y conciliaciones, se inyectan 8 pedidos con sus respectivos tickets de preparación y pagos:

1. **`#SEED01`** (`DELIVERED`): Pago `PAID` (SumUp). Comanda de cocina completada (`DONE`). Cliente: Juan Pérez.
2. **`#SEED02`** (`DELIVERED`): Pago `PAID` (SumUp). Incluye modificadores (Latte Mediano con Leche de Avena). Comanda completada (`DONE`). Cliente: María González.
3. **`#SEED03`** (`DELIVERED`): Pago `PAID` (SumUp). Comanda completada (`DONE`). Cliente: Carlos Rojas.
4. **`#SEED04`** (`READY` - Listo en barra): Pago `PAID` (SumUp). Incluye Capuccino Almendra y Brownie. Comanda completada (`DONE`). Cliente: Ana Silva.
5. **`#SEED05`** (`READY` - Listo en barra): Pago `PAID` (SumUp). Comanda completada (`DONE`). Cliente: Diego Muñoz.
6. **`#SEED06`** (`PREPARING` - En cocina): Pago `PAID` (SumUp). Cliente: Invitado (Guest). Comanda en preparación (`IN_PROGRESS`).
7. **`#SEED07`** (`CONFIRMED` - Esperando preparación): Pago `PENDING` (SumUp). Cliente: Juan Pérez. Comanda pendiente (`PENDING`).
8. **`#SEED08`** (`CONFIRMED` - Esperando preparación): Pago `FAILED` (Pago Rechazado/Anulado). Cliente: María González. Comanda pendiente (`PENDING`).

---

## 8. Chatbots y Mensajería (Conversaciones de WhatsApp)

Se inicializa una sesión de canal (`ChannelSession`) bajo el identificador de conversación `session_demo_juan` para el cliente Juan Pérez.
Se cargan 5 mensajes que representan un flujo conversacional real del bot de autopedido de SATEM para adquirir la ensalada y bebida del pedido `#SEED07`.
