---
name: whatsapp-evolution
description: Esqueleto e interfaz de integración con API de WhatsApp.
---

# WhatsApp Integration

## Propósito

Abstraer el envío de mensajes de texto, componentes interactivos y templates vía la API de WhatsApp, asegurando un punto único de entrada para todas las comunicaciones hacia los clientes (`Customer`).

## Cuándo debe cargarse automáticamente

- Al implementar el flujo del Chatbot de pedidos.
- Al orquestar alertas proactivas a clientes (ej. "Tu pedido está listo").
- Al trabajar sobre el adaptador en `src/integrations/whatsapp/`.

## Estado Actual y Convenciones detectadas

El proyecto cuenta actualmente con un esqueleto (`WhatsAppIntegration`) que lanza `NotImplementedError`.
Las bases arquitectónicas para el desarrollo futuro son:

- **Interfaz Aislada:** El tipo `WhatsAppMessagePayload` abstrae el formato bruto de Meta/Evolution API para que el servicio de chat (ej: `ChatService`) arme un objeto agnóstico.
- **Tipos de Mensajes:** Los envíos se limitan estáticamente a los definidos en `type`: `'text' | 'template' | 'interactive'`.
- **Stateless Adaptor:** La clase `WhatsAppIntegration` no almacena variables de estado ni tokens fijos, sino que los recibe por parámetro (`phoneNumberId`, `accessToken`) para ser compatible con el diseño Multi-Tenant, permitiendo que cada Local (`Location`) / Canal (`Channel`) utilice credenciales distintas desde su `Channel.config`.

## Anti-patrones a evitar

- Crear flujos lógicos conversacionales o validaciones de intención (NLP/IA) directamente dentro de la clase `WhatsAppIntegration`. Esa lógica pertenece al Chatbot (Capa de servicio).
- Almacenar tokens (accessTokens) directamente en los archivos de la integración en lugar de consumirlos inyectados desde la BD o `.env`.

## Referencias

- Esqueleto de Integración: `src/integrations/whatsapp/index.ts`
