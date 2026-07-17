---
name: coding-standards
description: Estándares de código (TypeScript, ESLint, Prettier) y convenciones específicas de SATEM Food Engine.
---

# Coding Standards

## Propósito

Garantizar la consistencia estilística y la robustez técnica en todo el código base de la aplicación.

## Cuándo debe cargarse automáticamente

- Durante la escritura de cualquier nuevo archivo fuente.
- En fases de refactorización (`refactoring`).
- Al revisar estándares visuales o lógicos.

## Responsabilidades

- Asegurar que el código TypeScript cumpla con las reglas estrictas.
- Aplicar un estilo de formato consistente.

## Convenciones detectadas en el proyecto

- **TypeScript:** Modo `strict: true` activado (`tsconfig.json`). El uso de `any` está prohibido (requerido por `AGENTS.md`).
- **ESLint:** Configuración flat (`eslint.config.mjs`) que integra reglas de Next.js (`core-web-vitals`) y Prettier.
- **Prettier:** Se usa para el formato final (sin punto y coma, comillas simples, tabWidth 2, trailingComma es5).
- **Tailwind:** El orden de clases se gestiona con `prettier-plugin-tailwindcss` y la importación de CSS usa Tailwind v4 (`@import "tailwindcss"` en `globals.css`).

## Patrones

- Importaciones absolutas con alias `@/` que apuntan a `src/`.
- Uso de `Server Components` de Next.js por defecto.
- Tipos unificados en `src/types/index.ts` (interfaces para entidades, enums en PascalCase pero valores string UPPER_CASE acordes a Prisma).

## Anti-patrones a evitar

- Utilizar `// @ts-ignore` sin justificación extrema documentada.
- Mezclar estilos inline `style={{ ... }}` con clases de Tailwind.
- Utilizar non-null assertions (`!`) asumiendo que los datos existen.

## Referencias

- Archivos de configuración: `eslint.config.mjs`, `.prettierrc`, `tsconfig.json`.
