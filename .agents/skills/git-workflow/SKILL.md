---
name: git-workflow
description: Reglas y convenciones del flujo Git y procesos de CI locales para el proyecto.
---

# Git Workflow

## Propósito

Definir los pasos requeridos previos al commit y los ganchos (hooks) automáticos para asegurar que solo código funcional y formateado llegue al repositorio de origen.

## Cuándo debe cargarse automáticamente

- Al momento de hacer staging de archivos, resolver conflictos de git o emitir commits.
- Durante fases de limpieza pre-commit (`project-review`).

## Convenciones detectadas en el proyecto

- **Husky & lint-staged:** Están configurados en `package.json`. Al hacer un commit, Husky ejecuta las reglas definidas en `lint-staged.config.mjs` de manera automática sobre los archivos `*.ts`, `*.tsx`, `*.json` y `*.md`.
- **Prettier + ESLint Fix:** El gancho se encarga de aplicar formato Prettier y reparar vulnerabilidades o estilo con `eslint --fix` en caliente antes de guardar el commit.
- **Sin Errores de Tipo:** `AGENTS.md` define que el comando estricto previo a integración es `npm run type-check`.

## Checklist antes de hacer Commit

- [ ] ¿Los nombres de archivo nuevos están en minúsculas kebab-case o PascalCase según su responsabilidad?
- [ ] ¿Se resolvieron todos los `any` temporales usando type guards o `unknown`?
- [ ] ¿Pasa `npm run type-check` de forma limpia localmente?

## Anti-patrones a evitar

- Usar el flag `--no-verify` en `git commit` evadiendo los controles de Husky.
- Subir archivos `.env` (siempre verificar el `.gitignore` y subir únicamente `.env.example`).
- Crear commits "wip" gigantes. Se prefieren commits granulares e iterativos.
