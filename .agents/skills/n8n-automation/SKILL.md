---
name: n8n-automation
description: Patrones de integración y automatización con n8n Webhooks.
---

# n8n Automation

## Propósito

Definir cómo SATEM Food Engine se comunica hacia n8n para delegar flujos de trabajo asíncronos (notificaciones de stock bajo, alertas de nuevos pedidos, envíos de correo).

## Cuándo debe cargarse automáticamente

- Al implementar lógica en `src/integrations/n8n/`.
- Al disparar eventos asíncronos en los servicios que requieran notificar al exterior sin bloquear la petición HTTP principal de Next.js.

## Convenciones detectadas en el proyecto

- **Esqueleto de Integración:** Existe `N8nIntegration` en `src/integrations/n8n/index.ts`.
- **Payload Estructurado:** La interfaz `N8nTriggerPayload` exige `{ event: string, timestamp: string, data: Record<string, unknown> }`.
- **Desacoplamiento:** Los servicios (ej. `OrderService`) no saben cómo funciona n8n. Solo preparan el payload y llaman al adaptador (`triggerWorkflow`).

## Patrones

- **Uso de Webhooks:** La comunicación hacia n8n es unidireccional vía webhooks POST. Las variables de entorno en `.env.example` definen endpoints específicos (ej: `N8N_WEBHOOK_ORDER_COMANDA`, `N8N_WEBHOOK_LOW_STOCK_ALERT`).
- **Lanzar y olvidar (Fire and Forget):** En Next.js, se puede usar `waitUntil()` o manejar de manera asíncrona no bloqueante el llamado a n8n para que la UI no sufra latencias innecesarias si n8n tarda en procesar.

## Anti-patrones a evitar

- Colocar lógica de negocio (condiciones de inventario, sumas de precios) dentro del flujo de n8n. **Toda la lógica pertenece a SATEM Food Engine**, n8n solo distribuye mensajes o ejecuta tareas rutinarias (envío de mails, SMS).
- Exponer URLs de webhooks de n8n en Client Components (deben invocarse siempre vía Server Actions o API Routes seguras).

## Referencias

- Interfaz de Payload: `src/integrations/n8n/index.ts`
- Variables de Webhook: `.env.example`
