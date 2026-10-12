# SATEM — Manual Multi-Agente + OpenSpec

Flujo: **Usuario → Antigravity → OpenSpec (proposal/specs/design/tasks) → Orchestrator → agentes → Tests → Security → Review → Approved → OpenSpec archive**.

## Precedencia de reglas

1. [`AGENTS.md`](./AGENTS.md) (arquitectura, reglas críticas del MVP) — siempre prevalece.
2. `openspec/config.yaml` y los documentos del cambio activo.
3. Skills (`.agents/skills/`) y subagentes (`.agents/subagents/`).

## Agentes (`.agents/subagents/`)

| Agente               | Responsabilidad                                        |
| -------------------- | ------------------------------------------------------ |
| orchestrator         | Coordina todo el proceso                               |
| requirements-analyst | Analiza requisitos                                     |
| solution-architect   | Diseña arquitectura                                    |
| backend-node         | Node.js/TypeScript (Next.js route handlers + services) |
| frontend-react       | React / Next.js                                        |
| frontend-angular     | Angular (no aplica a este proyecto)                    |
| database-prisma      | Prisma / PostgreSQL                                    |
| api-architect        | Contratos REST                                         |
| tester               | Testing (Vitest)                                       |
| debugger             | Diagnóstico                                            |
| security-reviewer    | Seguridad                                              |
| code-reviewer        | Calidad                                                |
| performance-reviewer | Performance                                            |
| devops               | Docker / EasyPanel / VPS                               |
| documentation        | Documentación                                          |

## Skills (`.agents/skills/`)

- **Sistema:** `satem-code-review`, `openspec-*`.
- **Dominio:** `food-engine`, `inventory-domain`, `kitchen-dashboard`, `tablet-ui`.
- **Integraciones/infra:** `postgresql-prisma`, `docker-easypanel`, `n8n-automation`, `whatsapp-evolution`, `microsoft365`, `openrouter`.

## Flujos

- **Feature pequeña:** Orchestrator → implementación → tests → review.
- **Feature compleja:** `/openspec-propose` → requirements → architecture → specs → tasks → orchestrator → backend/frontend/database → tests → security → code review → performance → DevOps → tasks `[x]` → archive.

## Reglas para todos los agentes

Leer antes de modificar; respetar OpenSpec y el stack existente; evitar cambios fuera de alcance; no inventar requisitos; no añadir dependencias innecesarias; no hardcodear secretos; no operaciones destructivas en producción (DROP, TRUNCATE, DELETE masivo, `db push`); `git status` antes de cambios importantes y nunca `git reset --hard`, `git clean -fd` ni `git checkout -- .`; ejecutar pruebas; dejar evidencia.

## Reporte de agente

`Objective · Files analyzed · Files modified · Changes · Validation · Problems · Remaining work`.

## Validación

`npm run type-check` · `npm run lint` · `npm test` · `npm run build` · `npx prisma validate` · `npx prisma migrate status`.

## Reglas específicas

- Detección de código sin uso: considerar referencias indirectas; nunca eliminar por búsqueda simple.
- Estilos: no aplicar `satem-design-system` (proyecto de cliente externo); mantener la identidad visual existente.
- Cambiar de motor de BD o framework = proyecto OpenSpec independiente.
- Dependencias: revisar alternativa existente, impacto, mantenimiento, seguridad y justificar.
