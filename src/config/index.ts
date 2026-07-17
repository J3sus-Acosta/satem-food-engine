/**
 * Application-wide configuration constants.
 *
 * This file is isomorphic (safe for both server and client).
 * Do NOT import secrets or server-only modules here.
 * Access environment variables that must stay private via src/server/ only.
 */

export const APP_CONFIG = {
  name: 'SATEM Food Engine',
  description:
    'Plataforma SaaS para restaurantes, cafeterías y food trucks con carta digital, chatbot de pedidos y gestión de inventario.',
  version: '0.1.0',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const

export const TENANT_CONFIG = {
  defaultOrganizationSlug: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG ?? 'mci-santiago',
  defaultLocationSlug: process.env.NEXT_PUBLIC_DEFAULT_LOCATION_SLUG ?? 'foodtruck-patio',
} as const

export const ROUTES = {
  home: '/',
  menu: '/menu',
  orders: '/orders',
  dashboard: {
    root: '/dashboard',
    orders: '/dashboard/orders',
    products: '/dashboard/products',
    inventory: '/dashboard/inventory',
    settings: '/dashboard/settings',
  },
  api: {
    orders: '/api/orders',
    products: '/api/products',
    chat: '/api/chat',
    payments: '/api/payments',
    inventory: '/api/inventory',
    webhooks: {
      n8n: '/api/webhooks/n8n',
    },
  },
} as const

/**
 * Payment configuration.
 *
 * NOTE: This config is read server-side only.
 * Do NOT import this block from Client Components.
 *
 * Supported PAYMENT_PROVIDER values:
 *   sumup       — SumUp hosted checkout (fully implemented)
 *   webpay      — Transbank Webpay Plus (skeleton, not yet implemented)
 *
 * Planned (not yet scaffolded):
 *   stripe      — Stripe Payment Intents
 *   mercadopago — Mercado Pago Checkout Pro
 */
export const PAYMENT_CONFIG = {
  /** Active payment provider key — resolved at runtime by PaymentProviderFactory. */
  provider: process.env.PAYMENT_PROVIDER ?? 'sumup',
} as const
