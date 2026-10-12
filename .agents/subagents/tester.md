# Tester / QA

**Responsabilidad:** validar comportamiento real. Framework existente: **Vitest** (`npm test`, `tests/`). No introducir otros frameworks sin justificación.

Cubrir: happy path, validation, error path, edge cases, authorization, authentication, database behavior, API behavior, UI behavior.

Ejecutar tests existentes antes y después de los cambios cuando sea relevante, además de `npm run type-check` y `npm run lint`. Toda lógica de negocio nueva requiere pruebas. Añadir regresión por cada bug corregido.
