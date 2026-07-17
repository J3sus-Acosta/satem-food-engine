# Release Notes — SATEM Food Engine v1.0.0-rc1

## Resumen Ejecutivo

SATEM Food Engine v1.0.0-rc1 representa el primer candidato de lanzamiento oficial para el piloto operativo de **MCI Santiago** en su patio de sucursales. Esta versión implementa el ciclo comercial y operativo end-to-end: consulta del menú interactivo por parte del cliente, personalización de comandas con modificadores del sistema, checkout seguro local, integración con pasarelas de pago (SumUp / Webpay Plus) con webhook idempotente seguro, y un panel interactivo Kanban para la cocina (KDS) que asiste en la preparación y entrega en tiempo real.

---

## Características Implementadas

1. **Carta Digital Mobile-First (`/menu`)**: Menú responsivo con categorización dinámica, imágenes de productos y personalizador de acompañamientos con reglas restrictivas del catálogo (min/max modificadores).
2. **Checkout e Inmutabilidad (`/api/orders/checkout`)**: Creación de órdenes en base de datos. Implementa el **Snapshot Pattern** congelando precios y nombres en el momento de la compra para blindar los registros contables contra cambios futuros de catálogo.
3. **Gestión Operativa de Cocina (KDS Kanban)**: Dashboard táctil interactivo en `/dashboard/kitchen` para coordinar estados de preparación (PENDING → PREPARING → READY → DELIVERED).
4. **Multi-Tenant / Multi-Sucursal de Pagos**: Inyección dinámica de configuraciones de pasarela según la jerarquía establecida (Sucursal → Organización → Variables de Entorno) delegada en `PaymentProviderFactory`.
5. **Integración con Hojas de Cálculo (Google Sheets CMS)**: Webhook sincronizado a través de n8n para importar anulaciones del menú diario (precios temporales, stock diario y disponibilidad) basándose en SKUs.
6. **Seguridad y Robustez en Concurrencia**:
   - Transacciones interactiva de Prisma con lógica de reintentos automatizados para evitar colisiones concurrentes de números de orden.
   - Idempotencia en webhooks mediante actualización atómica condicional de estado de pagos (`confirmIfPending`).
   - Verificación de firma criptográfica mediante HMAC-SHA256 para webhooks de SumUp y estructura estricta para Webpay Plus.

---

## Arquitectura y Stack Tecnológico

- **Framework**: Next.js 16.2.10 (App Router, Turbopack habilitado)
- **Runtime**: Node.js v20+ / React 19.2.4
- **Persistencia**: PostgreSQL administrado con Prisma ORM 6.9.0
- **Estilos**: Tailwind CSS 4 con componentes shadcn/ui (`@base-ui/react`)
- **Automatización**: n8n Workflow Automation (Sincronización y Mantenimiento nocturno)
- **Arquitectura de Software**: Clean Architecture basada en capas de desacoplamiento estricto:
  - **Types**: Modelos y tipos isomórficos puros independientes de tecnologías.
  - **Repositories**: Contratos puros en `interfaces/` e implementaciones Prisma en `prisma/`.
  - **Services**: Lógica de negocio y casos de uso puros libres de dependencias de UI o HTTP.
  - **Route Handlers / API**: Controladores delegadores del protocolo HTTP.

---

## Cobertura de Pruebas

- **Framework de Testing**: Vitest 3.2.7
- **Cobertura actual**: 32 pruebas críticas de flujo de negocio pasando con éxito (100% verde):
  - Flujo de sincronización de Sheets y validaciones de estructura de datos.
  - Generación, persistencia y aplicación de overrides del menú diario.
  - Casos de uso de checkout, restricciones de modificadores obligatorios y validaciones de stock diario.
  - Máquina de estados KDS e integridad de transacciones de cocina.
  - Selección jerárquica de pasarelas e idempotencia ante webhooks repetidos de pago.

---

## Estado del Proyecto

El proyecto se declara oficialmente en estado **Release Candidate (RC1)**. El motor central de comandas, pagos, KDS y sincronización diaria de menú es completamente operativo y apto para iniciar pruebas en entornos controlados y pilotos cerrados.

---

## Limitaciones Conocidas

1. **Control de Flujo de Peticiones (Rate Limiting)**: El checkout y las API de pago públicas no tienen limitadores de peticiones por IP implementados por defecto.
2. **CORS Abierto**: No hay restricción estricta de orígenes cruzados en los Route Handlers públicos.
3. **Módulo de Inventario Preliminar**: La API `/api/inventory/low-stock` devuelve una estructura vacía segura debido a que el módulo completo de mermas e ingredientes no forma parte del MVP actual.

---

## Roadmap Inmediato

1. **Fase 10**: Integración bidireccional con API de WhatsApp (Evolution API) para notificaciones al cliente e integraciones conversacionales con IA.
2. **Fase 11**: Incorporación de Middleware de Seguridad (Rate Limiting, CORS, cabeceras HTTP de protección).
3. **Fase 12**: Sistema transversal de Logging Estructurado (Pino/Winston) conectado a agregadores de observabilidad.

---

## Breaking Changes

- **Endpoints Obsoletos**: Los endpoints antiguos `/api/kitchen/orders/[id]/prepare` y `/ready` han sido marcados con **HTTP 410 Gone**. Las integraciones existentes deben migrar de inmediato a la ruta unificada PATCH `/api/kitchen/orders/[id]/status` enviando `{ "status": "PREPARING" | "READY" | "COMPLETED" }`.

---

## Checklist de Release

- [x] Ejecutar `npm run type-check` sin errores.
- [x] Ejecutar `npm run lint` sin warnings de error.
- [x] Compilar bundle de producción optimizado (`npm run build`) con Turbopack de forma exitosa.
- [x] Ejecutar suite de pruebas unitarias (`npm run test`) logrando 32/32 tests en verde.
- [x] Verificar que las variables `.env.example` estén al día para el despliegue.
