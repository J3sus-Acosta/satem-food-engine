# Flujo Comercial de Integración de Pagos — SATEM Food Engine

Este documento define la secuencia end-to-end y la arquitectura para el procesamiento de pagos reales y mockeados en SATEM Food Engine, garantizando el aislamiento de responsabilidades y la idempotencia del linter de transacciones.

---

## 1. Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant CheckoutAPI as API Route: Checkout
    participant OrderService as Servicio: OrderService
    participant PaymentAPI as API Route: Payment
    participant PaymentService as Servicio: PaymentService
    participant Factory as Factory: PaymentProviderFactory
    participant Provider as Proveedor: IPaymentProvider
    participant Gateway as Pasarela Externa
    participant WebhookAPI as API Route: Webhook
    participant Kitchen as Dashboard Cocina

    Cliente->>CheckoutAPI: POST /api/orders/checkout (items, datos de cliente)
    CheckoutAPI->>OrderService: createCustomerOrder()
    Note over OrderService: Valida stock, precios y modificadores
    OrderService-->>CheckoutAPI: Retorna Order (DRAFT)
    CheckoutAPI-->>Cliente: Redirige a /menu/track?id={orderId}

    Cliente->>PaymentAPI: POST /api/orders/{id}/payment
    PaymentAPI->>PaymentService: createPaymentIntent()
    Note over PaymentService: Crea registro Payment en base de datos
    PaymentService->>Factory: build(configuration)
    Factory-->>PaymentService: Retorna instancia del Proveedor (SumUp/Webpay)
    PaymentService->>Provider: createIntent(paymentId, amount)
    Provider->>Gateway: POST /checkouts (crea sesión de pago)
    Gateway-->>Provider: Retorna checkoutUrl y externalId
    Provider-->>PaymentService: Retorna CreatePaymentIntentResult
    Note over PaymentService: Guarda externalId del pago en base de datos
    PaymentService-->>PaymentAPI: Retorna checkoutUrl y paymentId
    PaymentAPI-->>Cliente: Redirige a pasarela (checkoutUrl)

    Cliente->>Gateway: Procesa transacción de pago
    Gateway->>WebhookAPI: POST /api/webhooks/sumup (firma + payload de pago exitoso)
    WebhookAPI->>PaymentService: processProviderWebhook()
    Note over PaymentService: Valida firma, idempotencia y busca ID de pago
    PaymentService->>OrderService: confirmOrder()
    Note over OrderService: Cambia Order.status a CONFIRMED
    OrderService-->>Kitchen: Notifica orden lista en pantalla Kanban
    PaymentService-->>WebhookAPI: Retorna 200 OK

    Note over Cliente: Polling cada 5s a /api/orders/{id}/status
    Cliente->>PaymentAPI: GET /api/orders/{id}/status
    PaymentAPI-->>Cliente: Retorna status = CONFIRMED (PAID en UI)
    Note over Cliente: Visualiza "Pago Confirmado / En Cocina"
```

---

## 2. Aislamiento de Capas y Multi-Tenancy

1. **Resolución de Configuración:** `ITenantConfigurationRepository` resuelve la prioridad de credenciales del local comercial:
   `Location.paymentProvider → Organization.paymentProvider → process.env → SUMUP`.
2. **Factory Desacoplada:** `PaymentProviderFactory` recibe la configuración Json resuelta y construye la instancia del proveedor inyectándole el payload. Nunca realiza consultas a la base de datos de Prisma directamente.
3. **Idempotencia:** El `PaymentService` realiza una validación de estado del pago (`PAID`, `FAILED`, `REFUNDED`) antes de aplicar transiciones sobre el pedido, protegiendo al backend de re-procesamientos por reintentos de red del webhook.
