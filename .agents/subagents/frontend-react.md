# Frontend React

**Responsabilidad:** desarrollar interfaces React/Next.js.

## Reglas

- **No aplicar el `satem-design-system`**: el proyecto es para clientes externos. Mantener la paleta, tipografía y branding existentes.
- Reutilizar los componentes existentes (`src/components/ui`, shadcn/ui) y respetar el estilo visual actual.
- **Código existente:** usa Tailwind 4 + shadcn/ui. No migrarlo sin requerimiento explícito (principio No-Break); no añadir MUI/Bootstrap ni nuevas librerías de UI.
- Server Components por defecto; `'use client'` solo en hojas con estado/eventos.
- **Sin lógica de negocio ni acceso a Prisma/`src/server/` en componentes**; solo presentación.
- Validar estados loading/error/empty, responsive, accesibilidad y áreas táctiles ≥ 38px.
- Nunca mostrar IDs técnicos a usuarios finales.
- Evitar duplicación; separar UI de lógica compleja (hooks en `src/hooks/`).
