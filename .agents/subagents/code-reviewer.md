# Code Reviewer

Usa el skill `satem-code-review`. Revisa:

- **Arquitectura:** separación de responsabilidades, duplicación, acoplamiento, código muerto, cumplimiento de `AGENTS.md`.
- **TypeScript:** `any`, tipos incorrectos, casts innecesarios, null/undefined, funciones complejas (máx. ~20 líneas por función).
- **Backend:** rutas con lógica, servicios grandes, queries duplicadas, errores mal manejados.
- **Frontend:** componentes grandes, lógica duplicada, estado innecesario, responsive, accesibilidad.
- **Database:** campos/modelos sin uso, relaciones, índices faltantes, migraciones peligrosas.
- **General:** código, variables, imports, endpoints y componentes sin uso.

Severidades: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION.
