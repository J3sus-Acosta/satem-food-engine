---
name: clean-architecture
description: Reglas estructurales de Clean Architecture adaptadas al proyecto SATEM Food Engine.
---

# Clean Architecture (SATEM)

## Propósito

Asegurar que la lógica de negocio, el acceso a datos y la interfaz de usuario se mantengan estrictamente desacoplados, facilitando el mantenimiento y el testing.

## Cuándo debe cargarse automáticamente

- Al crear nuevos dominios (ej. un nuevo módulo de reservas).
- Al refactorizar lógica entre componentes, servicios o repositorios.
- Al revisar PRs o evaluar impacto de arquitectura (`project-review`).

## Responsabilidades por Capa

1. **Rutas (UI)** (`src/app/`): Solo presentación. Consumen `services/` pasándole parámetros. No tienen lógica de dominio.
2. **API Routes** (`src/app/api/`): Contratos HTTP externos. Sin lógica de dominio. Delegan en `services/`.
3. **Servicios** (`src/services/`): Reglas de negocio puras. Orquestan repositorios e integraciones. Lidian con tipos de dominio, no con esquemas de base de datos directamente.
4. **Repositorios** (`src/repositories/`): Interfaces e implementación de acceso a datos (`PrismaOrderRepository`). Mapean de base de datos a tipos de dominio.
5. **Integraciones** (`src/integrations/`): Adaptadores hacia el mundo exterior (SumUp, n8n, WhatsApp).

## Convenciones detectadas

- **Server-Only:** Todos los archivos en `src/server/` y `src/services/` que accedan a secretos o base de datos usan la directiva `import 'server-only'`.
- **Inyección de Dependencias (DI):** Los servicios reciben sus repositorios por el constructor en su inicialización (ej. `new OrderService(orderRepo)`).
- **Tipos de Dominio:** Los tipos viven en `src/types/index.ts` y no dependen de bibliotecas ORM ni frameworks visuales.

## Anti-patrones a evitar

- Componentes React llamando a la base de datos o Prisma directamente (Rompe separación de presentación).
- Client Components (`'use client'`) importando módulos de `src/server/` o `src/services/` (Error de build / Fuga de secretos).
- Servicios ejecutando llamadas HTTP directas con `fetch` hacia las propias API Routes (Llamar a funciones directamente).

## Referencias

- Reglas base: `AGENTS.md` (Regla Arquitectónica Principal).
- Ejemplo de servicio: `src/services/orders/index.ts`.
