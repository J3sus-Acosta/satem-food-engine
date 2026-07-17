---
name: microsoft365
description: Integración de Microsoft 365 (Pendiente de futura implementación).
---

# Microsoft 365 Integration

## Propósito

Abstraer y centralizar la integración de Microsoft 365 (ej. correos vía Exchange, calendario, documentos) para no ensuciar la capa de servicios de dominio.

## Estado Actual

> **PREPARADO PARA FUTURA INTEGRACIÓN**
> Actualmente no existe una implementación en el directorio `src/integrations/microsoft365`. Este módulo se documenta conceptualmente basándose en el patrón de "Integraciones Aisladas" del proyecto.

## Cuándo debe cargarse automáticamente

- Cuando comience la Fase de desarrollo que incluya Microsoft Graph API o Exchange.

## Convenciones Conceptuales Esperadas

- **Aislamiento:** La lógica de autenticación de MS Graph debe vivir íntegramente dentro de `src/integrations/microsoft365/`.
- **Inyección de Dependencias:** El servicio de dominio (ej. `NotificationService`) recibirá la integración mediante una interfaz (ej. `IMailProvider`).
- **Resiliencia:** Capturar errores externos (HTTP 5xx de Microsoft) y lanzar un `IntegrationError` en lugar de exponer el error original al route handler.

## Anti-patrones a evitar (Diseño)

- Importar el SDK de Microsoft Graph directamente dentro de `OrderService` o un Server Component.
- Almacenar tokens de actualización sin encriptar o directamente expuestos al cliente (siempre manejarlos en `src/server/`).
