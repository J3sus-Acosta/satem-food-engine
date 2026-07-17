---
name: token-economy
description: Directivas operacionales del agente para reducir redundancia, consumo de tokens de contexto y optimizar interacciones.
---

# Token Economy & Prompting Directives

## Propósito

Guiar la operación interna de los agentes (Antigravity, etc.) para que sus respuestas y código generado consuman la menor cantidad de tokens posible sin perder precisión, preservando el contexto del LLM.

## Cuándo debe cargarse automáticamente

- Cuando las tareas de generación de código excedan un límite razonable o al escribir planes extensos.
- Constantemente durante iteraciones de desarrollo (`refactoring`, generación).

## Reglas de Economía de Tokens para Agentes

- **Asumir Conocimiento Existente:** No reexplicar conceptos de negocio o arquitectura base si ya están detallados en `AGENTS.md` o en otros Skills (ej. no expliques de nuevo la Clean Architecture al crear un route handler). Utiliza referencias (`Ver clean-architecture`).
- **Modificación Parcial:** Cuando sugieras o apliques cambios en código, prefiere modificar únicamente los bloques o funciones necesarias. Evita sobreescribir o "dump" (volcar) archivos completos de +300 líneas si el cambio afecta solo 10 líneas. (Usa herramientas de replace/diff).
- **Concisión en Respuestas:** Responde al usuario de manera asertiva y directa. Omite introducciones largas, disculpas, justificaciones extensas (a menos que se pida) o el clásico "Aquí tienes tu código actualizado:".
- **DRY en Skills:** Los archivos `SKILL.md` (como este) están altamente modularizados. Si necesitas la información sobre Prisma, invoca el skill `postgresql-prisma` en lugar de solicitar un volcado gigante al prompt raíz.
