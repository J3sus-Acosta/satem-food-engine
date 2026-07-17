---
name: openrouter
description: Patrones para integración con LLMs / OpenRouter (Pendiente de implementación).
---

# OpenRouter / LLMs

## Propósito

Definir la estrategia de enrutamiento y abstracción para modelos de Inteligencia Artificial (Chatbots de ventas, análisis de intención), facilitando cambiar proveedores sin afectar la lógica.

## Estado Actual

> **PREPARADO PARA FUTURA INTEGRACIÓN**
> El `.env.example` solo define actualmente `OPENAI_API_KEY` y `GOOGLE_GENERATIVE_AI_API_KEY`. No existe aún una abstracción de OpenRouter ni código funcional del Chatbot. Este Skill documenta las expectativas de arquitectura.

## Cuándo debe cargarse automáticamente

- Al implementar el módulo Chatbot para ventas.
- Al crear el adaptador en `src/integrations/llm/` o `src/integrations/openrouter/`.

## Convenciones Conceptuales

- **Mantenimiento del Estado:** El estado conversacional se guarda en Prisma (`ChannelSession.context`). El LLM no debe depender de memoria local volátil, debe ser _stateless_ a nivel de infraestructura.
- **Tipos de Mensajes:** Los roles deben mapearse al Enum `MessageRole` (`USER`, `ASSISTANT`, `SYSTEM`).
- **Aislamiento de Prompts:** Los system prompts no deben vivir "harcodeados" en medio de funciones del dominio; idealmente en la carpeta `prompts/` (creada en la raíz del proyecto).

## Anti-patrones a evitar

- Instanciar clientes de OpenAI/Gemini directamente dentro de los Controladores de webhook de WhatsApp o Telegram.
- Colocar lógica de guardrails o validación de productos dentro de la integración del LLM (esa lógica pertenece a `ProductService` u `OrderService`).
