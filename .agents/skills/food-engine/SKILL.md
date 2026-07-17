---
name: food-engine
description: Reglas fundamentales del dominio central de pedidos y catálogo (SATEM Food Engine).
---

# Food Engine (Dominio Central)

## Propósito

Explicar el modelo de dominio central, incluyendo la gestión multi-tenant, ciclo de vida del pedido y patrón snapshot de productos.

## Cuándo debe cargarse automáticamente

- Al implementar nuevas reglas de negocio sobre Pedidos (`Order`) o Catálogo (`Product`, `Menu`).
- Al alterar los flujos de creación o transición de estados de pedidos.

## Convenciones del Dominio

- **Multi-tenancy:** Todo pertenece a una `Organization` (tenant principal). Las operaciones de ventas y stock están acotadas a un `Location` (sucursal operativa).
- **Snapshot Pattern:** Cuando un cliente realiza un pedido, el nombre, precio y modificadores de los ítems (`OrderItem`, `OrderItemModifier`) se copian y congelan. Cambios posteriores en el catálogo NO alteran el historial del pedido.
- **Ciclo de Vida de Pedidos:**
  - `DRAFT`: En construcción (carrito).
  - `PENDING`: Enviado, pago pendiente.
  - `CONFIRMED`: Aceptado. Genera un ticket en cocina (`KitchenTicket`).
  - `PREPARING` -> `READY` -> `DELIVERED`.
- **Independencia de Pagos:** El estado de un pedido (`OrderStatus`) y el estado de su pago (`PaymentStatus`) son entidades separadas. Un pedido puede ser pagado contra entrega (`PaymentStatus: PENDING`, `OrderStatus: CONFIRMED`).
- **Número Secuencial:** El `orderNumber` (ej. `#001`) es legible por humanos y aislado por `Location`, diferente del ID CUID interno.

## Referencias

- Modelos Prisma: `prisma/schema.prisma`
- Tipos de Dominio: `src/types/index.ts`
- Lógica de Pedidos: `src/services/orders/index.ts`
