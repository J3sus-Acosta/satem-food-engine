# Tasks

> Alcance de todas las tareas: **solo lectura** sobre el código. Archivos a crear permitidos: `openspec/changes/auditoria-tecnica-integral/audit-report.md`. Fuera de alcance: cualquier archivo de `src/`, `prisma/`, `docker/`, `.env`, infraestructura.

## 1. Línea base automatizada

- [x] 1.1 Ejecutar `git status`, `npm run type-check`, `npm run lint`, `npm test` y registrar resultados; verificar que quedan anotados en la sección "Línea base" de `audit-report.md`
- [x] 1.2 Ejecutar `npx prisma validate` y `npx prisma migrate status` (sin aplicar nada) y registrar el estado; verificar salida anotada en el informe
- [x] 1.3 Ejecutar `npm audit` y listar dependencias no usadas/obsoletas; verificar tabla en el informe

## 2. Arquitectura y cumplimiento de AGENTS.md

- [x] 2.1 Listar imports de `@/server/db`/Prisma fuera de repositorios (servicios, páginas, rutas) con archivo y línea; verificar tabla de violaciones en el informe
- [x] 2.2 Detectar lógica de negocio en route handlers y componentes; verificar hallazgos con severidad
- [x] 2.3 Verificar reglas críticas §11.5 (PaymentProviderFactory, OrderService, OrderSequence, ProductVersion/CatalogAuditLog, anulaciones, sufijo PEDIDO WEB, POS customerName); verificar checklist cumple/no cumple
- [x] 2.4 Verificar aislamiento de integraciones (`src/integrations`, interfaces, factories); verificar hallazgos

## 3. Calidad de código TypeScript

- [x] 3.1 Inventariar `any`, `!`, `@ts-ignore`, `eslint-disable`, `console.*`, `catch {}` con conteos por carpeta; verificar tabla en el informe
- [x] 3.2 Detectar funciones >20 líneas y duplicación relevante en servicios; verificar lista priorizada

## 4. Seguridad

- [x] 4.1 Revisar autenticación, sesiones/cookies, hashing PBKDF2 y `middleware.ts`; verificar hallazgos
- [x] 4.2 Revisar autorización por permiso/rol y aislamiento multi-tenant (Organization/Location) en cada route handler; verificar matriz ruta × control de acceso
- [x] 4.3 Revisar validación de input, IDOR, exposición de IDs técnicos, secretos y `.env`/`.env.example`; verificar hallazgos

## 5. Base de datos y API

- [x] 5.1 Revisar `schema.prisma`: relaciones, índices faltantes, campos/modelos sin uso, migraciones; verificar lista
- [x] 5.2 Revisar contratos de API (`ApiResponse<T>`, status codes, paginación, errores); verificar tabla de inconsistencias

## 6. Frontend, testing e infraestructura

- [x] 6.1 Revisar frontend: componentes grandes, `'use client'` innecesarios, responsive, accesibilidad, estados loading/error/empty; verificar hallazgos
- [x] 6.2 Evaluar cobertura de tests por dominio frente a servicios existentes; verificar mapa servicio → test
- [x] 6.3 Revisar Docker/EasyPanel/nixpacks, health checks, variables de entorno y documentación de despliegue; verificar hallazgos
- [x] 6.4 Detectar código sin uso con verificación de referencias indirectas; verificar lista marcada como SUGGESTION

## 7. Consolidación

- [x] 7.1 Redactar resumen ejecutivo, clasificar todos los hallazgos (CRITICAL/HIGH/MEDIUM/LOW/SUGGESTION) y generar backlog priorizado de cambios de remediación; verificar que `audit-report.md` existe y cada hallazgo tiene evidencia y recomendación
- [x] 7.2 Confirmar con `git status` que no hay cambios fuera de `openspec/`; verificar salida limpia
