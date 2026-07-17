---
name: performance
description: Estrategias de optimización de rendimiento para bases de datos (Prisma) y SSR/RSC (Next.js).
---

# Performance y Optimización

## Propósito

Evitar cuellos de botella mediante un manejo eficiente de la base de datos y un correcto uso de la caché y el renderizado en Next.js.

## Cuándo debe cargarse automáticamente

- Al diseñar o refactorizar consultas complejas en Prisma.
- Al optimizar la carga de páginas públicas (Server Components).
- Al lidiar con problemas de latencia o consumo excesivo de memoria.

## Convenciones detectadas en el proyecto

- **Prisma Connection Pooling:** El Singleton `src/server/db.ts` protege el agotamiento de conexiones en desarrollo por el hot-reloading de Next.js. En producción se instancia una sola vez.
- **Server Components:** El proyecto empuja la ejecución de componentes hacia el servidor (`app/page.tsx`, etc.), reduciendo el bundle size que llega al navegador. Client Components (`'use client'`) solo se usan en las "hojas" del árbol de componentes (ej: un botón `AddToCart`).
- **Data Fetching:** Se prefiere el consumo directo del Servicio de Dominio en el Server Component (`const data = await orderService.get()`) en lugar de hacer `fetch('/api/orders')` (lo que requeriría saltos HTTP adicionales innecesarios).

## Patrones

- **Carga de Relaciones Optimizada:** En repositorios Prisma (ej. `PrismaOrderRepository.ts`), usar explícitamente `include: { items: { include: { modifiers: true } } }` solo cuando se necesita el grafo completo, y usar `select` para limitar datos cuando es una lista grande.
- **Paginación Estándar:** Las consultas que listan datos (ej. órdenes, inventario) deben recibir e implementar la interfaz `PaginationParams` (`page`, `limit`) para evitar bloqueos por consultas completas de tabla (Table Scans indirectos).

## Anti-patrones a evitar

- Hacer bucles (loops) que ejecuten consultas a Prisma iterativamente (N+1 query problem). En su lugar, extraer IDs en un arreglo y usar `in: [...]`.
- Abusar de `'use client'` al principio del árbol de carpetas de Next.js (ej. en el layout principal), forzando a todo el sub-árbol a renderizarse en el cliente y perdiendo SEO / Performance.
