# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc1] - 2026-07-17

### Added

- **Fase 1 — Infraestructura**: Configuración inicial del proyecto con soporte para TypeScript, ESLint, Prettier, Husky y lint-staged.
- **Fase 2 — Modelo de Dominio**: Diseño inicial de base de datos multi-tenant mediante `schema.prisma` y validación de tipos del dominio.
- **Fase 3 — Catálogo Digital**: Modelado de Categorías, Productos, Variantes y Modificadores. Implementación de controladores REST de catálogo.
- **Fase 4 — Pedidos**: Capa de servicios y repositorios para la gestión del ciclo de vida de comandas (DRAFT, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED).
- **Fase 5 — Pagos**: Integración con SumUp (Intención de cobro, webhook idempotente).
- **Fase 5.5 — Multi-Provider / Multi-Tenant de Pagos**: Patrón de resolución jerárquica de pasarelas de pago (Local → Organización → `.env` → SumUp) con soporte para inyección de configuraciones mediante `PaymentProviderFactory` y `ITenantConfigurationRepository`.
- **Fase 6 — Pantalla de Cocina**: Cola del Kitchen Display System en tiempo de ejecución (FIFO) y vistas preliminares del KDS.
- **Fase 7A — Menú Operacional**: Vistas para modificar el menú diario táctil a nivel administrativo en el dashboard.
- **Fase 7B — Google Sheets CMS + n8n Sync**: Integración con hojas de cálculo de Google Drive a través de flujos de n8n para importar Overrides de menú diario en lote de forma automatizada.
- **Fase 7C — Estabilización MVP**: Suite de pruebas con Vitest, auditoría inicial de seguridad y políticas de entorno de ejecución en producción.
- **Fase 8A — Frontend Cliente Público**: Interfaz de carta digital responsiva y mobile-first `/menu` con carrito local, notas y selección de modificadores.
- **Fase 8B — Checkout + Creación de Pedido**: Endpoint de API `/api/orders/checkout` y lógica para procesar pedidos DRAFT a partir del carrito público, validando modificadores y límites de stock.
- **Fase 8C — Order Tracking**: Pantalla de consulta de estado del pedido en tiempo real en `/menu/track` con polling integrado.
- **Fase 9A — Integración de Pagos Reales**: Webhooks reales para SumUp y Webpay Plus, lógica idempotente mejorada y pruebas unitarias de extremo a extremo.
- **Fase 9B — Kitchen Display System (KDS)**: Panel Kanban interactivo de KDS con soporte táctil, control de tiempos de preparación y polling inteligente.
- **Fase 9C — Versionado de Workflows n8n**: Exportación y versionado de los workflows de automatización n8n en el directorio `/n8n`.
- **Fase Auditoría (Críticos)**:
  - Endpoint `POST /api/menu/reset-daily` para purgar anulaciones diarias de menú.
  - Endpoint `GET /api/inventory/low-stock` para reportar alertas de inventario.
- **Fase Auditoría (Altos)**:
  - Método `confirmIfPending` en repositorios y servicios de pago para transacciones de webhook atómicas.
  - Utilidad central de respuestas y errores HTTP `handleRouteError` en `src/lib/api.ts`.
- **Fase Auditoría (Medios)**:
  - Centralización de `isConnectionError` en `src/repositories/prisma/shared.ts` para uniformar las fallas de conexión a PostgreSQL.

### Changed

- **Fase Auditoría (Altos)**:
  - Simplificación de `OrderService` mediante la eliminación de alias redundantes (`startPreparation` y `completeOrder`).
- **Fase Auditoría (Medios)**:
  - Actualización de `PrismaCatalogRepository` para arrojar errores de base de datos en producción en lugar de servir datos de prueba mock.
  - Actualización de la documentación en `README.md` especificando soporte oficial de Next.js 16.

### Fixed

- **Fase Auditoría (Críticos)**:
  - Se resolvió la condición de carrera concurrentes en la generación del identificador de pedido (`nextOrderNumber`) mediante el uso de transacciones interactivas secuenciales de Prisma y políticas de reintentos sobre códigos de error `P2002`.
  - Corrección en los workflows de n8n para apuntar a los endpoints correctos del backend del engine (`/api/webhooks/menu-sync` y `/api/menu/reset-daily`).
- **Fase Auditoría (Altos)**:
  - Los endpoints de cocina obsoletos (`/prepare` y `/ready`) ahora devuelven correctamente HTTP 410 Gone y redirigen al endpoint de estado unificado `/status`.
- **Fase Auditoría (Medios)**:
  - Se corrigió la lógica incompleta en `softDelete` de pedidos para deshabilitar también las líneas asociadas (`OrderItem`) asignando `deletedAt` en una única transacción de base de datos.

### Security

- **Fase Auditoría (Críticos)**:
  - Implementación de firma HMAC-SHA256 real en webhook de SumUp y validación de estructura segura para Webpay.
  - Restricción del endpoint `/api/menu/reset-daily` y webhook `/api/webhooks/menu-sync` mediante validación obligatoria de la cabecera `x-menu-sync-secret`.
- **Fase Auditoría (Medios)**:
  - Eliminación de logs informativos crudos (`console.log`) en métodos y pasarelas de pago de producción, reemplazándolos por `console.info` y comentarios explicativos.
