---
name: kitchen-dashboard
description: Conocimiento funcional y de arquitectura sobre el módulo operativo Kitchen Dashboard (Pantalla de Cocina).
---

# Kitchen Dashboard

## Propósito

Reglas operativas y convenciones visuales para la interfaz Kanban utilizada por el equipo de cocina para gestionar la preparación de pedidos.

## Cuándo debe cargarse automáticamente

- Al modificar código en `src/app/(dashboard)/kitchen/`.
- Al agregar nuevas funcionalidades a la gestión visual de comandas de cocina (`KitchenTicket`).

## Convenciones detectadas en el proyecto

- **Estados Visibles:** La cocina únicamente procesa estados confirmados. No puede ver `DRAFT`, `PENDING_PAYMENT`, `DELIVERED`, ni `CANCELLED`.
  Solo procesa:
  - `CONFIRMED` -> Nuevos pedidos.
  - `PREPARING` -> Pedidos en curso.
  - `READY` -> Pedidos terminados listos para despacho.
- **Acciones Táctiles:** La interfaz fue diseñada primariamente para pantallas táctiles (Tablets).
- **Consumo de Datos:** El Server Component asincrónico (la página) extrae directamente los pedidos usando `KitchenService.getActiveTickets()`, sin pasar por llamadas HTTP/fetch innecesarias.

## Patrones

- **Identificador visual:** Se despliega en grande el `#001` (`orderNumber`), no el ID interno.
- **Micro-interacciones:** Los botones de "Comenzar Preparación" y "Marcar Listo" deben proveer un feedback instantáneo visual y optimístico mientras se realiza el Action de Next.js.
- **Detalle del Producto:** Las tarjetas muestran los modificadores debajo de los ítems de manera identada para facilitar lectura rápida a la línea de cocina.

## Anti-patrones a evitar

- Colocar lógica de negocio para despachar un pedido dentro del React Component en lugar del Servicio de cocina.
- Utilizar diseños de tabla tradicional (`<table>`) en lugar de tarjetas Kanban.

## Referencias

- Ruta de UI: `src/app/dashboard/kitchen/page.tsx`
- Servicio: `src/services/kitchen/index.ts`
