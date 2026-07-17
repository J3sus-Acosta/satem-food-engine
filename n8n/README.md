# Automatización y Orquestación con n8n — SATEM Food Engine

Este directorio contiene la definición oficial y versionada de los workflows de n8n que orquestan los procesos en la nube, sincronizaciones de catálogo y eventos operacionales del negocio.

---

## 1. Arquitectura de Flujos de Datos

```
[ Google Sheets CMS ]
        │ (Publicado como CSV)
        ▼
[ n8n Workflow 01: Menu Sync ] ──────► [ SATEM Food Engine API ]
                                                  │
                                                  ▼
                                           [ PostgreSQL ]
                                                  │
                                                  ▼
                                              [ Pedido ]
                                                  │
                                                  ▼
[ n8n Workflow 02: Payment Webhooks ] ◄── [ Pasarela (SumUp/Webpay) ]
        │ (Normalización de eventos)
        ▼
[ SATEM /api/webhooks/sumup ]
        │ (Transiciona a CONFIRMED y envía a KDS)
        ▼
   [ Cocina / KDS ]
        │ (Cambio de estado)
        ▼
[ SATEM /api/orders/[id]/status ] ───► [ n8n Workflow 03: Order Status ]
                                                  │
                                                  ▼
                                         [ Notificación Cliente ]
```

---

## 2. Inventario de Workflows Versionados

| Workflow                   | Nombre de Archivo                                                      | Propósito                                                                      | Trigger                         | Frecuencia                          | Dependencias                                          |
| -------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| **01 Menu Sync**           | [`01-menu-sync.json`](workflows/01-menu-sync.json)                     | Sincroniza la disponibilidad y precios del menú diario.                        | Cron Schedule + Webhook manual  | Diario (08:00 AM) o bajo demanda    | Google Sheets URL                                     |
| **02 Payment Webhooks**    | [`02-payment-webhooks.json`](workflows/02-payment-webhooks.json)       | Captura y normaliza eventos de pago externos antes de enviarlos a SATEM.       | Webhook externo (SumUp)         | En tiempo real por transacción      | Endpoint `/api/webhooks/sumup`                        |
| **03 Order Status**        | [`03-order-status.json`](workflows/03-order-status.json)               | Recibe cambios de estado de órdenes y despacha alertas al cliente.             | Webhook interno de SATEM        | En tiempo real por cambio de estado | Notificador externo (WhatsApp/SMS)                    |
| **04 Nightly Maintenance** | [`04-nightly-maintenance.json`](workflows/04-nightly-maintenance.json) | Resetea los overrides de menú diarios y consolida las ventas del día anterior. | Cron Schedule                   | Diario (02:00 AM)                   | Endpoint `/api/menu/sync-daily/apply` y `/api/orders` |
| **05 Low Stock Alert**     | [`05-low-stock-alert.json`](workflows/05-low-stock-alert.json)         | Monitorea niveles de stock crítico e inicia alertas de reposición.             | Webhook interno + Cron por hora | Cada 1 hora o por evento            | Endpoint `/api/inventory/low-stock`                   |

---

## 3. Instrucciones de Despliegue y Configuración

- Para importar los workflows en una instancia limpia de n8n, sigue los pasos detallados en [**Guía de Importación (import-all.md)**](import-all.md).
- Para conocer la lista de variables de entorno y secretos necesarios para su correcto funcionamiento, consulta la sección de [**Variables de Entorno**](import-all.md#variables-y-secretos-necesarios).
