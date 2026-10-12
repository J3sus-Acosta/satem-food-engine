---
name: satem-code-review
description: Revisión integral de proyectos SATEM (arquitectura, backend, base de datos, frontend, seguridad, testing, infraestructura y código sin uso) con severidades CRITICAL a SUGGESTION. Solo lectura.
---

# SATEM Code Review

Realiza una revisión integral del proyecto. **Nunca modificar código durante una revisión salvo que el usuario lo solicite explícitamente.**

## 1. Arquitectura

- Separación de responsabilidades, duplicación, acoplamiento, dependencias, código muerto.
- Cumplimiento de `AGENTS.md` (sin Prisma fuera de repositorios, sin lógica de negocio en componentes/rutas, integraciones solo en `src/integrations`).

## 2. Backend (Next.js Route Handlers + services)

- Route Handlers delgados, validación de input, `ApiResponse<T>`, manejo de errores, servicios.

## 3. Database (Prisma / PostgreSQL)

- Modelos, relaciones, índices, migraciones, campos sin uso, queries innecesarias.

## 4. Frontend (React)

- Componentes, hooks, estado, responsive, accesibilidad, coherencia con el estilo visual existente.
- Si existe Angular: components, services, guards, interceptors.

## 5. Seguridad

- Autenticación, autorización (RBAC/permisos), cookies, secretos, CORS, CSRF, inyección, IDOR, validación, aislamiento multi-tenant.

## 6. Testing

- Cobertura, happy path, errores, edge cases, regresiones (Vitest).

## 7. Infraestructura

- Docker, EasyPanel, variables de entorno, health checks, logs, migraciones.

## 8. Código sin uso

- Campos, variables, funciones, endpoints, componentes, modelos, imports, tablas potencialmente obsoletas.
- Considerar referencias indirectas; nunca eliminar solo por búsqueda simple.

## Resultado

Clasificar hallazgos en: **CRITICAL** (vulnerabilidad, pérdida de datos, caída, violación de reglas fundamentales), **HIGH**, **MEDIUM**, **LOW**, **SUGGESTIONS**.
