# Design

## Context

Auditoría de solo lectura sobre Next.js 16 App Router + Prisma/PostgreSQL (ver proposal.md - Why). Capas esperadas según `AGENTS.md`: Route Handlers → Services → Repository Interfaces → Prisma. Estructura actual: `src/app` (103 archivos), `src/services` (37), `src/repositories` (32), `src/integrations` (11), `tests` (19 archivos Vitest), `prisma` (35 modelos, 5 migraciones).

## Goals / Non-Goals

**Goals:**

- Medir el cumplimiento de `AGENTS.md` (§1–11.5) con evidencia reproducible (comandos de búsqueda y salidas de herramientas).
- Entregar informe con severidades y backlog de remediación priorizado.

**Non-Goals:**

- Modificar código, esquema, infraestructura o dependencias.
- Remediar hallazgos (cada uno será un cambio OpenSpec propio).

## Decisions

1. **Ejecución por dimensiones usando los subagentes SATEM**: `code-reviewer` (arquitectura/TS), `security-reviewer`, `database-prisma`, `api-architect`, `tester`, `performance-reviewer`, `devops`. Alternativa: una sola pasada genérica; se descarta porque pierde profundidad por dominio.
2. **Evidencia primero**: cada hallazgo cita archivo/línea y el comando que lo detecta. Se prefiere `grep`/`rg` y salidas de `tsc`, `eslint`, `vitest`, `prisma validate`.
3. **Checklist de reglas verificables** derivado de `AGENTS.md`: Prisma fuera de repositorios; lógica en rutas/componentes; `any`, `!`, `console.log`, `catch {}`; `PaymentProviderFactory` en `PaymentService`; cambios de estado solo vía `OrderService`; `OrderSequence` atómico; `ProductVersion`/`CatalogAuditLog`; permisos `sales.void`, `locations.*`; IDs técnicos expuestos; sufijo `" PEDIDO WEB"`; `.env` fuera de Git.
4. **Código sin uso con cautela**: considerar referencias indirectas (rutas dinámicas, Server Actions, scripts); nunca proponer borrado por búsqueda simple.
5. **Salida**: un único `audit-report.md` en la carpeta del cambio + lista de cambios de remediación sugeridos.

## Risks / Trade-offs

- [Falsos positivos de código sin uso] → marcar como SUGGESTION y verificar referencias indirectas.
- [Ejecutar `build`/tests con `.env` apuntando a una BD real] → usar solo base de desarrollo/tests; no ejecutar migraciones ni `db push`.
- [Informe extenso] → resumen ejecutivo al inicio y hallazgos ordenados por severidad.

## Open Questions

- ¿Existe un entorno de staging contra el cual validar el despliegue? (no bloquea la auditoría estática).
