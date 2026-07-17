# n8n/

Esta carpeta contiene los workflows de n8n exportados en formato JSON para control de versiones.

## Convenciones

- Un archivo `.json` por workflow.
- Nombre en `kebab-case` describiendo la función: `order-comanda.json`, `low-stock-alert.json`.
- Cada workflow debe tener una descripción en el campo `description` de n8n.

## Workflows planificados

| Archivo                     | Función                                          |
| --------------------------- | ------------------------------------------------ |
| `order-comanda.json`        | Envía comanda a cocina cuando se confirma pedido |
| `low-stock-alert.json`      | Alerta cuando un producto baja del stock mínimo  |
| `payment-confirmation.json` | Notifica al cliente el pago confirmado           |
| `daily-report.json`         | Genera reporte diario de ventas                  |

## Cómo importar

1. Abre tu instancia de n8n.
2. Ve a **Workflows → Import from file**.
3. Selecciona el archivo `.json` de esta carpeta.
4. Configura las credenciales según el archivo `.env.example`.
