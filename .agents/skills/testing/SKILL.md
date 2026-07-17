---
name: testing
description: Estándares de verificación de calidad del código, chequeos estáticos y testing (Pendiente framework).
---

# Testing y Quality Assurance

## Propósito

Explicar el flujo actual de comprobación de salud del código y sentar las bases para la futura inyección de pruebas unitarias y End-to-End.

## Estado Actual

> **PREPARADO PARA FUTURA INTEGRACIÓN DE PRUEBAS**
> El proyecto aún no cuenta con frameworks como Jest, Vitest o Playwright configurados. Actualmente, el flujo de "Testing" depende estrictamente del chequeo estático del compilador y el linter. No inventes test runners hasta que el usuario especifique cuál instalar.

## Cuándo debe cargarse automáticamente

- Al momento de verificar si el código introducido causa regresiones (`project-review`).
- Al realizar integraciones continuas.

## Flujo Estático Actual (Convenciones Reales)

- El comando `npm run type-check` invoca a TypeScript (`tsc --noEmit`). Es el árbitro final para verificar que los cambios en servicios y repositorios no hayan roto cascadas en componentes (Ej. usar properties opcionales no controladas, tipos `any` introducidos).
- El comando `npm run lint` o `eslint` valida reglas Next.js estandarizadas y fallará si hay imports inválidos o react-hooks rompiendo reglas.

## Expectativas de Arquitectura para Pruebas (Diseño)

El proyecto está altamente desacoplado (Clean Architecture), lo que permite que en el futuro:

- Los Servicios (`src/services/`) se prueben inyectando repositorios simulados (mocks) porque utilizan clases orientadas a interfaces (`IOrderRepository`, etc.). Esto permite Testing Unitario veloz sin levantar PostgreSQL.
- Los Route Handlers se sometan a test de integración inyectando Requests (NextRequest) y analizando las respuestas envueltas en `ApiResponse<T>`.

## Checklist de validación actual

- [ ] Ejecutar `npm run type-check` en consola antes de dar por terminada la refactorización o cambio sustancial.
