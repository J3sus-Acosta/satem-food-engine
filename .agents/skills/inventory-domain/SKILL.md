---
name: inventory-domain
description: Reglas y modelos del módulo de inventario de stock, mermas e ingredientes.
---

# Inventory Domain

## Propósito

Abstraer el acceso al módulo de inventario (`InventoryService`), asegurando el manejo inmutable del stock mediante el patrón event-sourcing (append-only) de movimientos de inventario.

## Cuándo debe cargarse automáticamente

- Al implementar lógica en `src/services/inventory/`.
- Al realizar la integración entre despachos de pedidos y consumo de recetas (Fase futura).
- Al lidiar con alertas de stock bajo.

## Convenciones detectadas en el proyecto

- **Inmutabilidad (Append-only):** El stock real no se ajusta re-escribiendo de manera destructiva un valor numérico mágico. En cambio, Prisma define el modelo `StockMovement`. El stock disponible se puede calcular leyendo la suma de todos los movimientos de un `InventoryItem`.
- **Deltas de Stock:** Un movimiento positivo (PURCHASE, RETURN) aumenta el stock. Un movimiento negativo (SALE, WASTE) disminuye el stock.
- **Tipos de Movimientos:** En `src/types/index.ts`, `StockMovementType` enlista `PURCHASE`, `SALE`, `WASTE`, `ADJUSTMENT`, `RETURN`.
- **Multi-location:** `InventoryItem` está estrictamente enlazado a un `Location`. El catálogo de la materia prima (`Ingredient`) es global (`Organization`).

## Anti-patrones a evitar

- Actualizar `InventoryItem.quantity` sin generar el respectivo `StockMovement`.
- Eliminar (`delete`) un registro de `StockMovement`. Los errores humanos se corrigen generando un nuevo movimiento compensatorio (`ADJUSTMENT`).

## Referencias

- Modelo de inventario: `prisma/schema.prisma` (sección `INVENTORY`).
- Servicio (Esqueleto): `src/services/inventory/index.ts`.
