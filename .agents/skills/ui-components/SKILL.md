---
name: ui-components
description: Reglas y convenciones sobre estilos (Tailwind v4) y librerías de componentes (shadcn/ui).
---

# UI Components

## Propósito

Definir los lineamientos de presentación gráfica y maquetado. Garantiza que las interfaces (Client y Server Components) se mantengan predecibles, ligeras y desligadas de la lógica de negocio.

## Cuándo debe cargarse automáticamente

- Al construir o editar interfaces en `src/app/` o `src/components/`.
- Al crear nuevos primitivos visuales o layouts.

## Convenciones detectadas

- **Librería Base:** El proyecto utiliza `shadcn/ui` y `@base-ui/react` (referencia en `components.json` y `package.json`). Los primitivos se ubican en `src/components/ui/` y no deben contener dependencias de dominio.
- **Tailwind CSS v4:** El motor de utilidades está actualizado a la versión 4.
  - El tema global ya no reside en `tailwind.config.js`.
  - Las variables (fuentes, colores, tokens) y el `@theme` se definen íntegramente en `src/app/globals.css`.
- **Estructura de Componentes:** Las pantallas se ensamblan por composición.
  - `components/layout/`: Headers, Sidebars, Footers globales.
  - `components/ui/`: Primitivos exportados sin atar a un modelo.

## Patrones

- **Uso de `clsx` y `tailwind-merge`:** Toda construcción dinámica de clases de Tailwind se gestiona a través de la utilidad `cn(...)` (definida habitualmente en `src/lib/utils.ts`) para evitar conflictos de especificidad (ej: padding heredado vs custom).

## Anti-patrones a evitar

- Instanciar peticiones HTTP (`fetch`) o lógica estricta dentro del componente `ui` genérico.
- Usar clases de Tailwind obsoletas o arbitrarias (ej. colores fuera de paleta `bg-[#123123]`) en vez de los Semantic Tokens (`bg-primary`, `text-muted-foreground`).
- Escribir `style={{ ... }}` salvo situaciones de interpolación matemática que Tailwind no pueda manejar.

## Referencias

- `src/app/globals.css` (Configuración del motor Tailwind v4).
- `AGENTS.md` -> Sección 10 (Estilos y reglas asociadas).
