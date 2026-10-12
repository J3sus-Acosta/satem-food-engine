# Proposal

## Why

SATEM Food Engine creció rápido (≈37 servicios, 32 repositorios, 35 modelos Prisma, 14 dominios de API) y las reglas de `AGENTS.md` se han ido acumulando sin una verificación sistemática. Una inspección preliminar ya muestra desviaciones: servicios (`OrderVoidService`, `ReportingService`), páginas del dashboard y route handlers importan `@/server/db` directamente, existen ~104 `console.*`, ~62 usos de `any` y 19 `eslint-disable`/`@ts-ignore` en `src/`, con solo 19 archivos de test. Antes de seguir agregando funcionalidad conviene medir la deuda técnica y de seguridad y priorizarla.

## What Changes

- Realizar una **auditoría técnica integral de solo lectura** del repositorio (no se modifica código de aplicación) cubriendo: arquitectura y cumplimiento de `AGENTS.md`, backend/API, base de datos Prisma/PostgreSQL, frontend, seguridad, testing, infraestructura/despliegue y código sin uso.
- Producir un informe versionado en `openspec/changes/auditoria-tecnica-integral/audit-report.md` con hallazgos clasificados **CRITICAL / HIGH / MEDIUM / LOW / SUGGESTION**, evidencia (archivo/línea) y recomendación.
- Producir un backlog priorizado de cambios OpenSpec de remediación (uno por tema), sin ejecutarlos.
- Sin cambios de comportamiento, sin migraciones, sin nuevas dependencias.

## Capabilities

### New Capabilities

<!-- Ninguna: la auditoría no cambia comportamiento del sistema. -->

### Modified Capabilities

<!-- Ninguna. El cambio usa `skip_specs: true`. -->

## Impact

- **Código de aplicación:** ninguno (solo lectura). Se ejecutan `npm run type-check`, `npm run lint`, `npm test`, `npx prisma validate` y `npx prisma migrate status` como verificación; `npm run build` opcional.
- **APIs / base de datos:** solo análisis de contratos y `prisma/schema.prisma` (35 modelos, 5 migraciones); sin ejecutar operaciones destructivas ni tocar producción.
- **Seguridad:** revisión de auth, permisos, `middleware.ts`, secretos, IDOR, aislamiento multi-tenant.
- **Frontend:** revisión de componentes, responsive y accesibilidad dentro del estilo visual existente (no se aplica `satem-design-system`).
- **Infraestructura:** `Dockerfile`/`docker-compose.yml`/`nixpacks.toml`, variables de entorno, documentación de despliegue (sin modificar EasyPanel).
- **Integraciones externas:** SumUp, Telegram, WhatsApp, Google (revisión de adapters y aislamiento del dominio).
- **Non-goals:** corregir hallazgos, refactorizar, migrar Tailwind, cambiar de motor de BD.
