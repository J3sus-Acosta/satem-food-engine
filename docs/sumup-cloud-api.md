# Integración SumUp Cloud API & Terminal API — SATEM Food Engine

## Visión General

SATEM Food Engine integra de forma nativa la **SumUp Cloud API** en entorno **Sandbox** y **Producción** mediante el patrón de adaptadores (`IPaymentProvider`), desacoplado completamente de la lógica de dominio.

La integración soporta:

- **Hosted Checkouts**: Redirección del cliente a la pasarela web alojada por SumUp (`POST /v0.1/checkouts`).
- **Terminal API (Reader Solo)**: Cobros presenciales directo a lectores SumUp Solo (`POST /v1.0/merchants/{merchantCode}/readers/{readerId}/checkout`).
- **Webhooks HMAC-SHA256**: Confirmación asíncrona de pagos con verificación de firma e idempotencia estricta (`POST /api/webhooks/sumup`).
- **Diagnóstico en Tiempo Real**: Panel de diagnóstico y salud del merchant/lector (`/dashboard/sumup`).

---

## Configuración y Variables de Entorno

### Variables Disponibles

| Variable               | Tipo                        | Descripción                                         | Ejemplo             |
| ---------------------- | --------------------------- | --------------------------------------------------- | ------------------- |
| `SUMUP_ENVIRONMENT`    | `'sandbox' \| 'production'` | Entorno de ejecución                                | `"sandbox"`         |
| `SUMUP_API_KEY`        | `string`                    | API Key secreta emitida por SumUp                   | `"sup_sk_..."`      |
| `SUMUP_AFFILIATE_KEY`  | `string`                    | Key de afiliado para métricas de transacción        | `"aff_key_..."`     |
| `SUMUP_MERCHANT_CODE`  | `string`                    | Código de comercio SumUp (ej. M3R57S7J)             | `"M3R57S7J"`        |
| `SUMUP_READER_ID`      | `string`                    | ID único de lector físico o Virtual Solo (opcional) | `"RDR-SOLO-01"`     |
| `SUMUP_WEBHOOK_SECRET` | `string`                    | Secreto para verificar firmas HMAC-SHA256           | `"sec_webhook_..."` |

### Resolución Multi-Tenant

El proveedor de pago de SumUp respeta la jerarquía multi-tenant del sistema:

```
Location.paymentConfiguration → Organization.paymentConfiguration → process.env → SUMUP Fallback
```

Si una sucursal almacena credenciales específicas en la base de datos (`Location.paymentConfiguration`), `SumUpPaymentProvider` se instancia con esas credenciales exactas sin afectar a otros locales del mismo SaaS.

---

## Cómo Obtener una Cuenta Sandbox en SumUp

1. Inicia sesión o regístrate en el portal de desarrolladores de SumUp: [me.sumup.com](https://me.sumup.com/settings/developer?tab=sandboxes).
2. En la sección **Developer Settings → Sandboxes**, crea una cuenta de comerciante Sandbox.
3. Copia el **Merchant Code** (ej. `M3R57S7J`) y genera una **API Key**.
4. Configura la URL del webhook en el Dashboard de SumUp apuntando a:
   `https://tu-dominio.com/api/webhooks/sumup`
5. Copia el **Webhook Secret** e ingrésalo en tu archivo `.env`.

> [!NOTE]
> En Sandbox, los montos con valor `11` (en cualquier moneda) están diseñados para fallar explícitamente y probar flujos de rechazo de pago.

---

## Flujo Operativo y Endpoints Utilizados

### 1. Iniciar Intento de Pago (`POST /api/orders/[id]/payment`)

Invoca `paymentService.createPaymentIntent(orderId)`.
El adaptador ejecuta una llamada HTTP a SumUp Cloud API:

```http
POST https://api.sumup.com/v0.1/checkouts
Authorization: Bearer {SUMUP_API_KEY}
Content-Type: application/json

{
  "checkout_reference": "pay_clkyz...",
  "amount": 12500,
  "currency": "CLP",
  "merchant_code": "M3R57S7J",
  "description": "Pedido SATEM Food Engine #pay_clkyz...",
  "hosted_checkout": { "enabled": true },
  "redirect_url": "http://localhost:3000/menu/track?id=pay_clkyz..."
}
```

Retorna la URL `hosted_checkout_url` para redirección del cliente en el frontend `/menu/track`.

### 2. Notificación Webhook (`POST /api/webhooks/sumup`)

SumUp envía un evento webhook con el encabezado `sumup-signature`.
El servidor valida la firma HMAC-SHA256 con tiempo constante (`crypto.timingSafeEqual`).

Si el estado es `PAID` / `SUCCESSFUL`:

1. El pago se marca como `PAID` en base de datos.
2. `OrderService.confirmOrder(orderId)` actualiza la orden a `CONFIRMED`.
3. Se emite la comanda automática a pantalla de cocina.

### 3. Panel de Diagnóstico (`/dashboard/sumup`)

Ruta accesible en el panel administrativo para verificar:

- **Estado de Conexión**: Online, Sandbox Listo o Desconectado.
- **Entorno**: Sandbox vs Producción.
- **Detalle Merchant & Reader**: Código de comercio y terminal registrado.
- **Registro de Webhooks**: Hora y fecha de última notificación recibida.
