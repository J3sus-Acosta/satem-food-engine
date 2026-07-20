# Payment Providers — Guía de Arquitectura

## Resumen

SATEM Food Engine implementa una arquitectura **Multi-Provider / Multi-Tenant** para pagos.
El proveedor activo se resuelve dinámicamente por tenant en cada transacción —
sin modificar ningún servicio del dominio.

---

## Arquitectura

```
PaymentService.initiatePayment()
    ↓
ITenantConfigurationRepository.resolvePaymentConfig(locationId)
    ↓  [Location → Organization → .env → SUMUP]
PaymentConfiguration { provider, configuration }
    ↓
PaymentProviderFactory.build(config)
    ↓  [solo construye — no decide]
IPaymentProvider
    ↓
SumUpPaymentProvider | WebpayPaymentProvider | (futuros)
```

### Responsabilidades claras

| Componente                             | Responsabilidad única                                |
| -------------------------------------- | ---------------------------------------------------- |
| `ITenantConfigurationRepository`       | Contrato: obtiene config efectiva del tenant         |
| `PrismaTenantConfigurationRepository`  | Aplica jerarquía de prioridad con Prisma             |
| `PaymentProviderFactory.build(config)` | Solo construye `IPaymentProvider`                    |
| `PaymentService`                       | Orquesta pagos — desconoce el proveedor seleccionado |

### Ubicación de archivos

```
src/integrations/payments/
├── PaymentProviderFactory.ts        ← build(config) + resolve() fallback
├── index.ts                         ← barrel export del sub-módulo
├── interfaces/
│   └── IPaymentProvider.ts          ← contrato compartido (abstracción)
└── providers/
src/integrations/payments/
├── PaymentProviderFactory.ts        ← build(config) + resolve() fallback
├── index.ts                         ← barrel export del sub-módulo
├── interfaces/
│   └── IPaymentProvider.ts          ← contrato compartido (abstracción)
└── providers/
    ├── SumUpPaymentProvider.ts      ← implementación SumUp (inyección de credenciales y mock)
    └── WebpayPaymentProvider.ts     ← implementación Webpay (inyección de credenciales y mock)
```

---

## Cómo funciona `PaymentProviderFactory`

La fábrica es la única responsable de instanciar proveedores.
Acepta una configuración `PaymentConfiguration` efectiva del local y retorna
la implementación correspondiente de `IPaymentProvider` pasándole la configuración específica en el constructor.

```ts
// src/integrations/payments/PaymentProviderFactory.ts
static build(config: PaymentConfiguration): IPaymentProvider {
  return PaymentProviderFactory.buildFromKey(config.provider, config.configuration)
}
```

Esto evita cualquier lectura directa de variables de entorno o Prisma por parte de los adaptadores, asegurando una inyección de dependencias totalmente limpia.

---

## Contrato `IPaymentProvider`

Todos los adaptadores deben implementar exactamente estos cuatro métodos:

| Método                                      | Descripción                                         | Retorno                           |
| ------------------------------------------- | --------------------------------------------------- | --------------------------------- |
| `createIntent(paymentId, amount, currency)` | Crea una sesión de checkout en el proveedor         | `CreatePaymentIntentResult`       |
| `verifyWebhook(headers, rawBody)`           | Valida firma del webhook entrante                   | `WebhookVerificationResult`       |
| `fetchStatus(providerTransactionId)`        | Consulta estado activo de la transacción (fallback) | `'PAID' \| 'FAILED' \| 'PENDING'` |
| `refund(providerTransactionId, amount)`     | Inicia un reembolso                                 | `boolean`                         |

### `CreatePaymentIntentResult`

```ts
interface CreatePaymentIntentResult {
  providerTransactionId: string // ID de la transacción en el proveedor
  checkoutUrl: string // URL de pago para el cliente
  expiresAt?: Date // Expiración opcional de la sesión
  rawPayload: Record<string, unknown> // Respuesta raw del proveedor (audit)
}
```

### `WebhookVerificationResult`

```ts
interface WebhookVerificationResult {
  isValid: boolean
  paymentId: string // ID interno SATEM (puede venir en el payload)
  providerTransactionId: string
  amount: number
  status: 'PAID' | 'FAILED' | 'REFUNDED'
}
```

---

## Proveedores actuales

### SumUp (implementado con Cloud API oficial & Sandbox)

- **Activar**: `PAYMENT_PROVIDER=sumup`
- **Variables requeridas**: `SUMUP_ENVIRONMENT`, `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `SUMUP_WEBHOOK_SECRET`
- **Estado**: Integración oficial con SumUp Cloud API (Hosted Checkouts, Terminal API, Webhooks HMAC-SHA256 y Panel de Diagnóstico).
- **Documentación completa**: [`docs/sumup-cloud-api.md`](./sumup-cloud-api.md)
- **Archivo**: `src/integrations/payments/providers/SumUpPaymentProvider.ts`

### Webpay / Transbank (skeleton)

- **Activar**: `PAYMENT_PROVIDER=webpay`
- **Variables requeridas**: `WEBPAY_COMMERCE_CODE`, `WEBPAY_API_KEY`
- **Estado**: Esqueleto. Todos los métodos lanzan `NotImplementedError`.
- **Archivo**: `src/integrations/payments/providers/WebpayPaymentProvider.ts`

---

## Cómo agregar un nuevo proveedor

### Checklist

- [ ] **1. Crear el adaptador**

  ```
  src/integrations/payments/providers/StripePaymentProvider.ts
  ```

  Implementar `IPaymentProvider` completamente.

- [ ] **2. Añadir el caso en `PaymentProviderFactory`**

  ```ts
  case 'stripe': return new StripePaymentProvider()
  ```

  Añadir `'stripe'` al tipo `SupportedProvider`.

- [ ] **3. Documentar las variables de entorno en `.env.example`**

  ```bash
  # STRIPE_SECRET_KEY=""
  # STRIPE_WEBHOOK_SECRET=""
  ```

- [ ] **4. Actualizar esta documentación** con el nuevo proveedor.

- [ ] **5. Ejecutar verificaciones**
  ```bash
  npm run type-check
  npm run lint
  npm run build
  ```

> [!IMPORTANT]
> Nunca modificar `PaymentService`, `IPaymentProvider` ni `PaymentProviderFactory`
> para añadir lógica específica de un proveedor. Toda la lógica del proveedor
> vive exclusivamente dentro de su adaptador.

---

## Ejemplos de incorporación futura

### Stripe

```ts
// src/integrations/payments/providers/StripePaymentProvider.ts
import Stripe from 'stripe'
import type {
  IPaymentProvider,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
} from '../interfaces/IPaymentProvider'

export class StripePaymentProvider implements IPaymentProvider {
  private readonly client = new Stripe(process.env.STRIPE_SECRET_KEY!)

  async createIntent(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<CreatePaymentIntentResult> {
    const session = await this.client.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount * 100,
            product_data: { name: 'Pedido SATEM' },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { paymentId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/cancel`,
    })
    return {
      providerTransactionId: session.id,
      checkoutUrl: session.url!,
      rawPayload: session as unknown as Record<string, unknown>,
    }
  }
  // ... verifyWebhook, fetchStatus, refund
}
```

Activar: `PAYMENT_PROVIDER=stripe` (sin cambiar `PaymentService`).

---

### Mercado Pago

```ts
// src/integrations/payments/providers/MercadoPagoPaymentProvider.ts
import { MercadoPagoConfig, Preference } from 'mercadopago'
// Implementar IPaymentProvider usando la SDK oficial.
// Activar: PAYMENT_PROVIDER=mercadopago
```

---

### Webpay (Transbank)

```ts
// src/integrations/payments/providers/WebpayPaymentProvider.ts
import { WebpayPlus, Options, IntegrationApiKeys, Environment } from 'transbank-sdk'

export class WebpayPaymentProvider implements IPaymentProvider {
  async createIntent(
    paymentId: string,
    amount: number,
    _currency: string
  ): Promise<CreatePaymentIntentResult> {
    const tx = new WebpayPlus.Transaction(
      new Options(
        process.env.WEBPAY_COMMERCE_CODE!,
        process.env.WEBPAY_API_KEY!,
        Environment.Integration
      )
    )
    const response = await tx.create(paymentId, `return-url`, amount, paymentId)
    return {
      providerTransactionId: response.token,
      checkoutUrl: `${response.url}?token_ws=${response.token}`,
      rawPayload: response as unknown as Record<string, unknown>,
    }
  }
  // ... verifyWebhook, fetchStatus, refund
}
```

Activar: `PAYMENT_PROVIDER=webpay`.
El adaptador esqueleto ya existe — únicamente hay que implementar los métodos.

---

## Resolución del Proveedor (Multi-Tenant)

### Algoritmo de prioridad

```
ITenantConfigurationRepository.resolvePaymentConfig(locationId)
         │
         ▼
  Location.paymentProvider ──── ¿tiene valor? ──── SÍ ──► [USAR Location]
         │ NO
         ▼
  Organization.paymentProvider ── ¿tiene valor? ── SÍ ──► [USAR Organization]
         │ NO
         ▼
  process.env.PAYMENT_PROVIDER ── ¿definido? ───── SÍ ──► [USAR .env]
         │ NO
         ▼
      [SUMUP] ← fallback final
```

**Reglas:**

- `paymentConfiguration` **NUNCA se fusiona** entre niveles. Se usa la primera encontrada.
- `configuration` siempre es `{}` cuando ningún nivel tiene configuración.
- El resultado es siempre un `PaymentConfiguration` válido (nunca `null`).

### Modelo de datos

```prisma
model Organization {
  paymentProvider      PaymentProvider? // null = hereda de .env → SUMUP
  paymentConfiguration Json?            // Record<string, string>
}

model Location {
  paymentProvider      PaymentProvider? // null = hereda de Organization → .env → SUMUP
  paymentConfiguration Json?            // Record<string, string> — no se fusiona
}
```

### Ejemplos Multi-Tenant

Tres tenants en la misma instancia de SATEM Food Engine:

| Tenant                   | Location.paymentProvider | Organization.paymentProvider | .env    | Proveedor efectivo |
| ------------------------ | ------------------------ | ---------------------------- | ------- | ------------------ |
| **MCI Santiago**         | `null`                   | `null`                       | `SUMUP` | SUMUP              |
| **Restaurante Italiano** | `WEBPAY`                 | `null`                       | `SUMUP` | WEBPAY             |
| **Cafetería Centro**     | `null`                   | `STRIPE`                     | `SUMUP` | STRIPE             |
| **Sucursal Norte**       | `MERCADOPAGO`            | `WEBPAY`                     | `SUMUP` | MERCADOPAGO        |

### `PaymentConfiguration` — tipo fuertemente tipado

```ts
interface PaymentConfiguration {
  provider: PaymentProvider // proveedor resuelto
  configuration: Record<string, string> // config clave-valor simple (nunca null)
}
```
