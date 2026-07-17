---
name: refactoring
description: Reglas seguras y convenciones para extraer código, limpiar deuda técnica y reorganizar responsabilidades.
---

# Refactoring

## Propósito

Guiar al agente o desarrollador cuando se modifique código existente para mejorar su legibilidad, dividir su tamaño o reubicar su responsabilidad sin romper contratos actuales.

## Cuándo debe cargarse automáticamente

- Cuando el usuario solicite "Refactorizar X", "Extraer esta lógica", o "Limpiar este componente".
- Al dividir un archivo que exceda las recomendaciones (ej. archivos de más de 300 líneas).

## Patrones Seguros de Refactoring en SATEM

1. **Extraer a Servicios:** Si un Route Handler (`app/api/...`) o un Server Component tiene más de una llamada a Prisma o lógica condicional de negocio, debe extraerse de inmediato hacia un archivo en `src/services/`.
2. **Dividir Componentes Grandes (UI):** Empujar la interactividad (`'use client'`) hacia el final del árbol. Si un componente mezcla fetch de datos y `onClick`, divídelo: el componente "Padre" (Server Component) hace el fetch y pasa la información vía props al componente "Hijo" (Client Component) que maneja la UI.
3. **Migración Aditiva (DB):** Al refactorizar el modelo de datos (Prisma), prefiere añadir campos nuevos con `@default` u opcionales (`?`) en vez de borrar o cambiar tipos, para asegurar migraciones sin pérdida de datos históricos (`StockMovements`, `OrderItems`).

## Anti-patrones a evitar

- Refactorizar código que no posea tipos estrictos. (Paso previo obligado: arreglar el tipado TypeScript antes de mover la lógica).
- Cambiar la firma de interfaces en `src/types/index.ts` sin rastrear el uso en todo el proyecto y reparar las cascadas resultantes (correr `npm run type-check`).
- Crear imports circulares entre dominios dentro de `src/services/`.
