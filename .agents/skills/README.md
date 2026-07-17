# SATEM Skills Pack v2.0 - Index

Este directorio (`.agents/skills/`) contiene el paquete de conocimiento especializado para Antigravity IDE (o cualquier otro agente de IA) adaptado íntegramente a las arquitecturas y convenciones reales de **SATEM Food Engine**.

> **NOTA IMPORTANTE:** Los Skills aquí definidos COMPLEMENTAN el archivo `AGENTS.md` raíz. El archivo `AGENTS.md` contiene las reglas fundacionales, mientras que estos Skills se cargan **solo bajo demanda** para conservar tokens y proveer contexto focalizado por dominio.

## Índice de Skills

### 📐 Arquitectura & Diseño Estructural

- **[`api-design`](./api-design/SKILL.md):** Contratos HTTP ligeros, wrapper `ApiResponse<T>`, captura y parseo de errores de dominio a HTTP status codes.
- **[`clean-architecture`](./clean-architecture/SKILL.md):** Inyección de dependencias, roles de `services/`, aislamiento de UI (`app/`) y acceso a datos (`repositories/`).
- **[`coding-standards`](./coding-standards/SKILL.md):** Next.js App Router (Server Components por defecto), ESLint, Prettier y TypeScript (`strict: true`).
- **[`refactoring`](./refactoring/SKILL.md):** Reglas para extracción de componentes, desacoplamiento y migraciones de DB aditivas.

### 🥩 Dominio del Negocio (SATEM)

- **[`food-engine`](./food-engine/SKILL.md):** Patrón Snapshot en pedidos, Multi-Tenancy (Organization/Location), y el ciclo de vida del pedido (`OrderStatus`).
- **[`kitchen-dashboard`](./kitchen-dashboard/SKILL.md):** Interfaz Kanban táctil, estados visualizables (Confirmado, Preparando, Listo), y micro-interacciones (Server Actions sin HTTP `fetch`).
- **[`inventory-domain`](./inventory-domain/SKILL.md):** Patrón Event-Sourcing (Append-Only) vía deltas de `StockMovement` (PURCHASE, SALE, WASTE).

### ⚙️ Integraciones e Infraestructura

- **[`postgresql-prisma`](./postgresql-prisma/SKILL.md):** Patrones de Singleton Prisma (`server-only`), gestión de conexiones (fallbacks en dev), y modelado de datos en PostgreSQL.
- **[`n8n-automation`](./n8n-automation/SKILL.md):** Webhooks asíncronos (`fire-and-forget`) para eventos (stock bajo, mails) usando el adaptador `N8nIntegration`.
- **[`whatsapp-evolution`](./whatsapp-evolution/SKILL.md):** Esqueleto del adaptador para Meta/Evolution API; inyección de credenciales dinámicas por Location.
- **[`docker-easypanel`](./docker-easypanel/SKILL.md):** _(Pendiente)_ Expectativas de despliegue en Next.js Standalone.
- **[`microsoft365`](./microsoft365/SKILL.md):** _(Pendiente)_ Diseño de interfaces de integración.
- **[`openrouter`](./openrouter/SKILL.md):** _(Pendiente)_ Estrategia Stateless de LLMs.

### 🖥️ Interfaz de Usuario y Flujos de Trabajo

- **[`ui-components`](./ui-components/SKILL.md):** Uso de `shadcn/ui`, `tailwind-merge` (`cn`), y Tailwind CSS v4 con variables en `globals.css`.
- **[`tablet-ui`](./tablet-ui/SKILL.md):** Componentes ergonómicos (hit-boxes grandes, alto contraste) para cocinas/POS.
- **[`project-review`](./project-review/SKILL.md):** Checklists de autoevaluación del agente antes de finalizar tareas (Dry-Run, Compilación, Refactor).
- **[`git-workflow`](./git-workflow/SKILL.md):** Controles de Husky, `lint-staged` y `npm run type-check` previos al commit.
- **[`debugging`](./debugging/SKILL.md):** Clases de `src/lib/errors.ts` y diagnóstico (DB disconnection fallbacks vs ValidationErrors).
- **[`performance`](./performance/SKILL.md):** Server-Components pre-renderizados, limitación de client components y consultas Prisma selectivas.
- **[`security`](./security/SKILL.md):** Aislamiento Server-Only, manejo del `NEXT_PUBLIC_` y validación forzada multi-tenant.
- **[`testing`](./testing/SKILL.md):** _(Pendiente framework)_ Comprobaciones estáticas (`tsc`, lint).
- **[`token-economy`](./token-economy/SKILL.md):** Reglas para que los agentes sean concisos, apliquen deltas parciales en lugar de sobreescribir archivos masivos, y no repitan contexto.

---

**Nota:** El generador de este Skills Pack auditó el código del proyecto en Julio 2026. Todas las reglas son un reflejo del código fuente existente de SATEM.
