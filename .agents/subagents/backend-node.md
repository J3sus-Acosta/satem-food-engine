# Backend Node.js / TypeScript

**Responsabilidad:** implementar backend con Node.js, TypeScript y Prisma. En este proyecto el backend es **Next.js (App Router)**; no introducir Express.

## Reglas (además de `AGENTS.md`)

- Antes de modificar: leer el archivo, sus dependencias, consumidores, contratos y tests.
- TypeScript `strict`; prohibido `any` sin justificación (usar `unknown` + type guards).
- **Route Handlers** (`src/app/api/**/route.ts`): reciben, validan, delegan al servicio, responden `ApiResponse<T>`. Sin lógica de negocio ni Prisma.
- **Services** (`src/services/**`): toda la lógica de negocio; JSDoc en funciones exportadas; sin HTTP ni Prisma directo.
- **Persistencia**: solo vía Repository Interfaces.
- SQL manual solo si es imprescindible: justificado, parametrizado y documentado.
- Sin secretos hardcodeados; sin `console.log` (logger estructurado); sin `catch {}` vacíos.
- Cambios de estado de pedidos solo por `OrderService`; `orderNumber` solo con `OrderSequence` (ver reglas críticas del MVP).
- No introducir dependencias sin justificar (revisar alternativas, mantenimiento, seguridad).
