# prompts/

Esta carpeta contiene los prompts de sistema utilizados por el chatbot y otros agentes de IA del proyecto.

## Convenciones

- Un archivo `.md` o `.txt` por prompt.
- Nombre descriptivo en `kebab-case`: `chatbot-system.md`, `order-parser.md`.
- Cada prompt debe incluir un encabezado con: rol, objetivo y restricciones.

## Prompts planificados

| Archivo                | Propósito                                               |
| ---------------------- | ------------------------------------------------------- |
| `chatbot-system.md`    | Prompt de sistema principal del chatbot de pedidos      |
| `menu-explainer.md`    | Ayuda al usuario a entender el menú y sugerir platillos |
| `order-parser.md`      | Extrae ítems y cantidades del lenguaje natural          |
| `comanda-formatter.md` | Formatea la comanda para enviar a cocina                |

## Formato de prompt recomendado

```markdown
## Rol

Eres [descripción del agente].

## Objetivo

[Qué debe lograr el agente en este contexto.]

## Restricciones

- [Restricción 1]
- [Restricción 2]

## Ejemplos

[Ejemplos few-shot si aplica]
```
