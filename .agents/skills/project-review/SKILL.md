---
name: project-review
description: Checklist y proceso de revisión de código antes de finalizar o generar nuevas implementaciones.
---

# Project Review

## Propósito

Sistematizar el proceso de autoevaluación del agente o de revisión de Pull Requests para asegurar que los cambios se alinean al contexto de SATEM Food Engine y no introducen regresiones.

## Cuándo debe cargarse automáticamente

- Antes de emitir un comando final o resumen de tarea.
- Cuando el usuario solicita "Revisa este código", "Audita el módulo X", o "Verifica que cumple las reglas".

## Checklist antes de sugerir o finalizar cambios

1. **Reutilización:** ¿Se buscó primero si ya existía una interfaz, componente de UI (`shadcn`), tipo de error (`src/lib/errors.ts`) o utilidad en lugar de crear una nueva?
2. **Dependencias Arquitectónicas:**
   - ¿Se modificó `AGENTS.md`? (PROHIBIDO, a menos que el usuario indique una nueva regla fundacional).
   - ¿Un Client Component importó `src/server/db.ts`? (PROHIBIDO).
   - ¿Una API Route contiene lógica de negocio (`reduce`, reglas de validación complejas) en vez de llamar al Servicio? (PROHIBIDO).
3. **Consistencia de Tipos:** ¿Se evadió el sistema de tipos con `any` o conversiones silenciosas `as unknown as X`? (Requerido: usar zod, type guards o `unknown`).
4. **Impacto en el Dominio:** ¿Los cambios en el esquema de Prisma (si los hay) rompen consultas existentes?

## Resumen de Salida (Output)

Al ejecutar una revisión de proyecto o código (walkthrough), el agente debe presentar los resultados bajo los siguientes títulos:

- Archivos Inspeccionados.
- Violaciones de Arquitectura Detectadas (si las hay).
- Oportunidades de Reutilización.
- Estado de Compilación/Tests (`npm run type-check`).
- Veredicto y recomendaciones.
