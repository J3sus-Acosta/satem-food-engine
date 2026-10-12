# Informe de Auditoría Técnica Integral — SATEM Food Engine

Fecha: 2026-10-11 · Cambio OpenSpec: `auditoria-tecnica-integral` · Modo: solo lectura (ningún archivo de `src/`, `prisma/` ni infraestructura fue modificado).

> **Alcance y límites.** Las verificaciones automatizadas (type-check, lint, tests, prisma, npm audit) y los conteos con `grep` cubren todo `src/`. Las revisiones de autorización, sesión y pagos se hicieron leyendo los route handlers y módulos clave. Frontend, funciones largas, duplicación y código sin uso se revisaron por **muestreo y métricas** (no es lectura línea a línea de todo el repo). Los hallazgos marcados "a verificar" requieren confirmación antes de actuar.

## Resumen ejecutivo

| Severidad  | Cantidad |
| ---------- | -------- |
| CRITICAL   | 4        |
| HIGH       | 7        |
| MEDIUM     | 8        |
| LOW        | 4        |
| SUGGESTION | 4        |

Lo más urgente: (1) la firma de sesión usa un **secreto hardcodeado de respaldo** si falta `SESSION_SECRET`; (2) varias rutas que **mutan datos o confirman pagos no tienen ninguna autenticación** (`categories`, `payments/mock-confirm`, `orders/[id]` PATCH/items/status, `menu/sync-daily/apply`); (3) la anulación de ventas confía en `cashierUserId` enviado por el cliente. Estos puntos afectan directamente las reglas críticas de `AGENTS.md` (§11.5-6, 11.5-13) y la seguridad multi-tenant.

## Línea base (tareas 1.1–1.3)

| Verificación                | Resultado                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `git status`                | Solo cambios del bootstrap SATEM (agentes, skills, openspec, docs). Sin cambios de código de aplicación.                                                                                                     |
| `npm run type-check`        | PASS (exit 0)                                                                                                                                                                                                |
| `npm run lint`              | PASS con **121 warnings, 0 errores** (p. ej. variables sin uso en `PaymentService`)                                                                                                                          |
| `npm test`                  | PASS: 19 archivos, **122 tests**                                                                                                                                                                             |
| `npx prisma validate`       | PASS                                                                                                                                                                                                         |
| `npx prisma migrate status` | No ejecutable: `P1001` no hay BD en `localhost:5432` (esperado en este entorno). 5 migraciones en `prisma/migrations`.                                                                                       |
| `npm audit`                 | **34 vulnerabilidades: 4 critical, 22 high, 8 moderate** (p. ej. `undici`, `uuid` vía `exceljs`).                                                                                                            |
| `depcheck`                  | Sin uso aparente: `@prisma/client` (se usa `@/generated/prisma`), `shadcn`, `tw-animate-css`, `@types/react-dom`. Faltan declarar: `dotenv` (`prisma.config.ts`), `sharp` (script). Revisar antes de borrar. |

Salidas crudas en `scratch/audit/` (ignorado por Git).

## Hallazgos

### CRITICAL

**C1. Secreto de sesión hardcodeado como fallback** — [`src/lib/session.ts:12-13`](file:///d:/Dev/satem-food-engine/src/lib/session.ts#L12-L13)
`process.env.SESSION_SECRET || 'fallback-secret-key-satem-food-engine-...'`. Si la variable no está definida en producción, cualquiera con acceso al repo puede forjar sesiones (incluida de admin). Además `.env.example` no documenta `SESSION_SECRET` (menciona `AUTH_SECRET` comentado).
_Recomendación:_ fallar al arrancar si falta en producción, quitar el literal, documentar la variable correcta, rotar el secreto.

**C2. Endpoints mutantes sin autenticación fuera del `matcher` del middleware**
El middleware solo protege `/dashboard`, `/api/catalog|discounts|kitchen|pos|inventory`. Quedan públicos y sin chequeo en la ruta:

- `POST/PUT /api/categories` ([route](file:///d:/Dev/satem-food-engine/src/app/api/categories/route.ts)) y además importa `db` directamente.
- `POST /api/payments/mock-confirm`: permite **aprobar/rechazar pagos** por `paymentId` sin auth ni guarda de entorno.
- `PATCH /api/orders/[id]` (confirm/ready/deliver/cancel), `/orders/[id]/items` (POST/DELETE), `/orders/[id]/status`: cualquiera con un id de pedido puede modificarlo.
- `POST /api/menu/sync-daily/apply` (sin `x-menu-sync-secret`; `reset-daily` sí lo valida).
  _Recomendación:_ separar rutas públicas del cliente final (checkout con token de pedido) de rutas operativas; exigir sesión/permiso o secreto; deshabilitar `mock-confirm` en producción.

**C3. Anulación de ventas: identidad del cajero tomada del body** — [`void/execute/route.ts`](file:///d:/Dev/satem-food-engine/src/app/api/pos/orders/void/execute/route.ts)
`cashierUserId`, `locationId` llegan del cliente; la ruta no usa la sesión. Un usuario autenticado puede atribuir la anulación a otro cajero/sucursal (rompe auditoría inmutable, §11.5-13) y el `authorize` público de admin acepta `organizationId` del cliente (sin límite de intentos).
_Recomendación:_ derivar usuario/sucursal de la sesión; validar que el pedido pertenece a esa sucursal.

**C4. Dependencias con vulnerabilidades críticas/altas** — `npm audit`: 4 critical, 22 high.
_Recomendación:_ triage con `npm audit` (distinguir dev vs runtime), actualizar Next/undici, evaluar `exceljs`; cambio de remediación propio.

### HIGH

**H1. Autorización solo por "sesión válida" en rutas del catálogo, cocina, POS, descuentos e inventario.** Rutas como `catalog/products/*` (DELETE, restore, versions) y `kitchen/orders/*/status`, `pos/pay`, `inventory/low-stock` no verifican rol/permiso; el middleware solo comprueba que exista sesión. Cualquier usuario autenticado (p. ej. cocina) puede editar el catálogo. Contradice RBAC y reglas multi-tenant.

**H2. `PUT /api/catalog/products/[id]` pasa `body` crudo al servicio y `changeReason` por query**, sin validación de esquema ni usuario autor (`null`), por lo que el `ProductVersion`/`CatalogAuditLog` (§11.5-8) pierde al autor.

**H3. Sin validación estructurada de input.** No hay Zod ni equivalente; las rutas validan campo a campo a mano (`orders/[id]/pay` acepta `provider`, `amount`, `currency` del cliente → posible manipulación del monto/proveedor; viola además la regla de que el proveedor lo decide `ITenantConfigurationRepository`).

**H4. Sin rate limiting ni bloqueo en `auth/login` y `void/authorize`** → fuerza bruta de contraseñas (incl. credenciales ADMIN).

**H5. Sesión: comparación de firma no constante y sin revocación.** `signature !== expectedSignature` (no `timingSafeEqual`), sesión de 24h sin rotación ni lista de revocación; middleware solo valida firma y no que el usuario siga activo/permisos vigentes.

**H6. Violaciones arquitectónicas de acceso a datos (§Regla 3, 4, 11.5-2).** `@/server/db` importado fuera de repositorios en: 6 route handlers (`catalog/cash/*` ×5, `pos/orders/search`), 5 páginas/RSC (`menu`, `dashboard/cash|discounts|reports|users`), y servicios `OrderVoidService` (también `Prisma` de `@/generated`) y `ReportingService`; `CashService` importa tipos de `@/generated/prisma`. `mock-confirm` instancia `PrismaPaymentRepository` en la ruta.

**H7. Cobertura de tests insuficiente en áreas críticas.** Sin tests propios: `OrderVoidService` (dinero + auditoría), `ReportingService`, inventario, chat, y ningún test de **autorización de rutas**. 122 tests, todos de servicios con mocks; ninguno de integración con BD ni de handlers.

### MEDIUM

- **M1. `src/middleware.ts` con convención posiblemente obsoleta en Next 16** (a verificar en `node_modules/next/dist/docs/`; en 16 se renombra a `proxy`). Confirmar que el matcher realmente se ejecuta.
- **M2. 104 `console.*` en `src/`** (repositories 38, app 65, integrations 8, components 6, services 3, lib 2): prohibido por §11; riesgo de fuga de datos en logs. Falta logger estructurado.
- **M3. ~62 `any`** (app 38, repositories 19, services 5) y 19 `eslint-disable`/`@ts-ignore` (sobre todo `*DashboardClient.tsx`). Viola §6.
- **M4. Componentes gigantes:** `CatalogDashboardClient.tsx` (1963 líneas), `CashDashboardClient.tsx` (1715), `PosBoard.tsx` (1202), `MenuDashboardClient`/`ReportsDashboardClient` (~1060); también `PrismaOrderRepository` (1358) y `PrismaCatalogRepository` (1212). Mantenibilidad y riesgo de lógica de negocio en UI (a verificar contenido).
- **M5. PBKDF2 con solo 10.000 iteraciones SHA-512** ([`password-crypto.ts`](file:///d:/Dev/satem-food-engine/src/lib/password-crypto.ts)); recomendación OWASP actual ≈ 210.000. Requiere esquema de rehash gradual.
- **M6. `catch {}` vacío** en [`services/payments/index.ts:148`](file:///d:/Dev/satem-food-engine/src/services/payments/index.ts#L148) (prohibido por §11).
- **M7. Sin `loading.tsx`/`error.tsx`** en App Router y sin endpoint de health check; infraestructura (`nixpacks.toml`, Docker de la app) sin healthcheck documentado. `docker-compose.yml` solo define Postgres.
- **M8. Contrato de API inconsistente:** algunos handlers usan `handleRouteError`, otros (`catalog/products/[id]`) construyen errores a mano exponiendo `err.message`; `GET /api/orders` y similares sin paginación evidente (a verificar).

### LOW

- L1. 121 warnings de lint (variables no usadas, p. ej. `_provider`, `_amount`, `_currency`).
- L2. `types/index.ts` de 1054 líneas: tipos globales monolíticos (viola Interface Segregation).
- L3. `non-null !` en 3 sitios (components 1, repositories 2) sin comentario de justificación.
- L4. Solo 12 usos de `aria-*` en toda la UI; accesibilidad de la UI táctil (POS/KDS) a revisar.

### SUGGESTIONS

- S1. Dependencias aparentemente sin uso (`shadcn`, `tw-animate-css`, `@types/react-dom`): verificar uso en CSS/CLI antes de quitar; declarar `dotenv`/`sharp` si se usan.
- S2. Documentar variable de entorno de sesión y matriz de rutas públicas/privadas en `docs/`.
- S3. Añadir CI (lint + type-check + test + audit) — no existe `.github/`.
- S4. Código sin uso: no se detectaron candidatos concluyentes por búsqueda simple; ejecutar `knip`/`ts-prune` en un cambio aparte considerando referencias dinámicas.

## Cumplimiento de reglas críticas del MVP (§11.5) — tarea 2.3

| Regla                                                  | Estado                                                              | Evidencia                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 11.5-2 No Prisma desde servicios                       | **NO CUMPLE**                                                       | `OrderVoidService`, `ReportingService`                            |
| 11.5-5 PaymentService vía `PaymentProviderFactory`     | Parcial (a verificar)                                               | `orders/[id]/pay` acepta `provider` del cliente                   |
| 11.5-6 Cambios de estado vía `OrderService`            | Cumple en rutas revisadas                                           | `orders/[id]` usa `orderService`; protección ausente (C2)         |
| 11.5-7 `OrderSequence` atómico                         | Cubierto por test (`order-sequence.test.ts`); no auditado en código |
| 11.5-8 `ProductVersion`/`CatalogAuditLog`              | Parcial                                                             | autor `null` en PUT (H2)                                          |
| 11.5-11 PBKDF2                                         | Cumple (iteraciones bajas, M5)                                      | `password-crypto.ts`                                              |
| 11.5-13 Anulaciones                                    | **Parcial**                                                         | validación admin existe; identidad cajero del body (C3); sin test |
| 11.5-14/15/16 Menú público, sufijo, POS `customerName` | No auditado (UI)                                                    | cubierto parcialmente por tests de checkout                       |

## Aislamiento de integraciones — tarea 2.4

`src/integrations` contiene `interfaces`, `payments`, `sumup`, `telegram`, `whatsapp`, `google`; la firma del webhook de SumUp usa `timingSafeEqual` en `SumUpPaymentProvider` (bien). Pendiente verificar que ningún servicio importe proveedores concretos (solo se confirmó `mock-confirm` instanciando un repositorio Prisma en la ruta).

## Backlog de remediación priorizado (cambios OpenSpec sugeridos)

1. `secure-session-secret` — C1, H5 (quitar fallback, `timingSafeEqual`, rotación).
2. `lock-down-public-mutations` — C2, H4 (auth/secretos, rate limit, deshabilitar mock en prod).
3. `void-orders-session-identity` — C3 + tests de `OrderVoidService` (H7).
4. `route-authorization-matrix` — H1, H2, H3 (permisos por ruta + validación Zod).
5. `dependency-vulnerabilities` — C4 (`npm audit`).
6. `repository-boundary-cleanup` — H6 (mover `db` de rutas/páginas/servicios a repositorios).
7. `structured-logging-and-types` — M2, M3, M6, L1, L3.
8. `split-large-components` — M4.
9. `ops-health-and-ci` — M7, S3.
10. `password-hash-upgrade` — M5.
