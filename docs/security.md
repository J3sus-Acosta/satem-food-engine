# Guía de Seguridad y Manejo de Webhooks — SATEM Food Engine

Este documento define las políticas de seguridad, las directrices de verificación de firmas y las buenas prácticas para la gestión de secretos en producción para **SATEM Food Engine**.

---

## 1. Validación de Firmas y Secretos en Webhooks

La plataforma expone dos endpoints críticos para el consumo externo de servicios que deben ser estrictamente securizados:

### A. Webhook de SumUp (`/api/webhooks/sumup`)

Utilizado para recibir confirmaciones de pago asíncronas desde la pasarela de pagos SumUp.

- **Firma de Webhook (`x-mock-signature`):**
  - **Desarrollo/Testing:** Se permite el uso de firmas simuladas enviando el header `x-mock-signature: true` o dejando vacía la variable `SUMUP_WEBHOOK_SECRET`.
  - **Producción (`NODE_ENV === 'production'`):** El sistema rechaza cualquier simulación de firma de manera inmediata. Si la variable de entorno `SUMUP_WEBHOOK_SECRET` no está configurada, la verificación de firma fallará automáticamente retornando un estado `isValid: false`, impidiendo el procesamiento del webhook.
- **Protección contra Reenvíos:** La verificación de webhooks está protegida contra ataques de reenvío a nivel de servicio (`PaymentService.processProviderWebhook`) validando la idempotencia del ID de la transacción en la base de datos PostgreSQL.

### B. Webhook de Sincronización del Menú Diario (`/api/webhooks/menu-sync`)

Utilizado por **n8n** para aplicar cambios diarios operacionales definidos en la hoja de cálculo de Google Sheets.

- **Header de Seguridad (`x-menu-sync-secret`):**
  - **Desarrollo/Testing:** Si la variable `MENU_SYNC_SECRET` no está configurada en el `.env`, el endpoint permite sincronizaciones de prueba sin clave.
  - **Producción (`NODE_ENV === 'production'`):** La variable `MENU_SYNC_SECRET` es **estrictamente obligatoria**. Si está ausente o vacía en el servidor, cualquier intento de sincronización será rechazado con un código de respuesta HTTP `401 Unauthorized`.

---

## 2. Gestión de Errores sin Fuga de Información

Tanto el webhook de pagos como el de sincronización del menú están estructurados bajo las siguientes políticas de reporte de errores:

- **Logs del Servidor:** Toda excepción interna o error de firma se registra detalladamente en los logs del servidor utilizando `console.error` (que en producción es capturado por el recolector de logs de la nube o contenedor Docker).
- **Respuestas al Cliente:** Las respuestas HTTP correspondientes a errores de validación de negocio (`ValidationError` o `NotFoundError`) se mapean a códigos `400 Bad Request` y devuelven explicaciones formateadas para que el operador sepa qué fila o campo falló.
- **Excepciones Internas:** En caso de fallas de base de datos o excepciones no controladas de TypeScript, el sistema responde con un genérico `500 Internal Server Error` y el mensaje `"Error interno del servidor"` para evitar revelar la estructura del esquema Prisma o detalles de base de datos a atacantes externos.

---

## 3. Políticas y Rotación de Secretos

Para mantener los secretos seguros en entornos productivos, siga estas pautas:

| Secreto / Variable     | Frecuencia de Rotación        | Recomendación de Seguridad                                                                                                               |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Cada 6 - 12 meses             | Cadena de conexión cifrada (SSL/TLS). No exponer el puerto de PostgreSQL de forma pública a la red (usar subredes privadas o firewalls). |
| `SUMUP_WEBHOOK_SECRET` | Anual o ante sospecha de fuga | Generado directamente en el panel administrativo de SumUp al configurar la URL del webhook.                                              |
| `MENU_SYNC_SECRET`     | Cada 6 meses                  | Clave alfanumérica aleatoria de al menos 32 caracteres generada de manera segura (ej. `openssl rand -hex 32`).                           |

### Almacenamiento Seguro

- **Nunca** comitear archivos `.env` reales al control de versiones de Git.
- Utilizar el archivo [.env.example](file:///d:/Dev/satem-food-engine/.env.example) como plantilla de referencia de variables de entorno de desarrollo.
- En producción, inyectar los secretos directamente como variables de entorno del contenedor Docker/EasyPanel o a través del panel de configuración de la plataforma de hosting.
