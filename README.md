# SATEM Food Engine

> Plataforma SaaS para restaurantes, cafeterías y food trucks — carta digital, chatbot de pedidos, pagos y gestión de inventario, todo integrado con n8n.

---

## Visión General

SATEM Food Engine es una plataforma multi-tenant construida para modernizar la operación de negocios de comida. Permite a cualquier restaurante, cafetería o food truck tener presencia digital completa en minutos: una carta interactiva en línea, un chatbot que toma pedidos en lenguaje natural, cobro integrado y automatización de cocina e inventario.

### Problema que resuelve

La mayoría de los pequeños negocios de comida opera con procesos manuales fragmentados: WhatsApp para pedidos, Excel para inventario, papel para comandas. SATEM Food Engine unifica todo en una sola plataforma, reduciendo errores, tiempos de espera y costos operacionales.

### Roadmap de Implementación

| Fase         | Título                                     | Objetivos Core                                                                                                                                   | Estado        |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **FASE 1**   | **Infraestructura**                        | Configuración base, TypeScript, ESLint, lint-staged, Husky.                                                                                      | ✅ Completada |
| **FASE 2**   | **Modelo de Dominio**                      | Diseño de base de datos multi-tenant, `schema.prisma` y validaciones.                                                                            | ✅ Completada |
| **FASE 3**   | **Catálogo Digital**                       | Categorías, Productos, Variantes, Modificadores, Disponibilidad, Precios, API y página pública `/menu`.                                          | ✅ Completada |
| **FASE 4**   | **Pedidos**                                | Flujo completo de pedidos utilizando servicios de dominio.                                                                                       | ✅ Completada |
| **FASE 5**   | **Pagos**                                  | Integración de pasarela con SumUp y procesamiento idempotente de webhooks.                                                                       | ✅ Completada |
| **FASE 5.5** | **Multi-Provider / Multi-Tenant de Pagos** | Arquitectura multi-tenant: proveedor configurable por Organización, Local o `.env`. `ITenantConfigurationRepository` + `PaymentProviderFactory`. | ✅ Completada |
| **FASE 6**   | **Pantalla de Cocina**                     | Dashboard de cocina táctil Kanban en `/dashboard/kitchen` para gestión de preparación (FIFO).                                                    | ✅ Completada |
| **FASE 7A**  | **Menú Operacional**                       | Panel administrativo `/dashboard/menu` para overrides manuales táctiles.                                                                         | ✅ Completada |
| **FASE 7B**  | **Google Sheets CMS + n8n Sync**           | Sincronización automatizada diaria del menú mediante códigos SKU y webhook de n8n.                                                               | ✅ Completada |
| **FASE 7C**  | **Estabilización MVP**                     | Suite de testing con Vitest, auditoría arquitectónica, endurecimiento de seguridad en producción y documentación.                                | ✅ Completada |
| **FASE 8A**  | **Frontend Cliente Público**               | Carta digital táctil mobile-first en `/menu` con carrito de compras local, notas y personalizador.                                               | ✅ Completada |
| **FASE 8B**  | **Checkout + Creación de Pedido**          | Creación real de pedidos en estado DRAFT desde la carta, validando stock diario, modificadores obligatorios y snapshots.                         | ✅ Completada |
| **FASE 8C**  | **Order Tracking + Preparación de Pago**   | Consulta en tiempo real de estados de preparación del pedido con polling y preparación de flujos de pago (SumUp/Webpay).                         | ✅ Completada |
| **FASE 9A**  | **Integración de Pagos Reales MVP**        | Integración multi-tenant inyectable, webhook idempotente, polling liviano de status y suite de testing para SumUp y Webpay.                      | ✅ Completada |
| **FASE 10A** | **Integración Oficial SumUp Cloud API**    | Integración oficial SumUp (Sandbox/Prod), Terminal API, HMAC-SHA256, Panel de Diagnóstico y generador atómico `OrderSequence`.                   | ✅ Completada |
| **FASE 10B** | **Administración del Catálogo Maestro**    | Módulo completo `/dashboard/catalog` para definir productos, control de versiones (snapshots), logs de auditoría e ingredientes.                 | ✅ Completada |
| **FASE 11**  | **Caja / Cierre de Caja**                  | Control de turnos de caja, arqueo físico, flujos de ingresos/egresos, reportes consolidados y reaperturas administrativas.                       | ✅ Completada |
| **FASE 12A** | **Gestión de Usuarios (Admin)**            | Módulo completo `/dashboard/users` para administrar accesos, roles (ADMIN, MANAGER, CAJERO, etc.), estados y contraseñas de personal interno.    | ✅ Completada |

---

## Stack Tecnológico

| Capa           | Tecnología                         |
| -------------- | ---------------------------------- |
| Framework      | Next.js 16 (App Router)            |
| UI Library     | React 19                           |
| Lenguaje       | TypeScript 5 (strict mode)         |
| Estilos        | Tailwind CSS 4                     |
| Componentes    | shadcn/ui (`@base-ui/react` + CSS) |
| ORM            | Prisma (PostgreSQL)                |
| Automatización | n8n (self-hosted)                  |

---

## Arquitectura de Datos

**PostgreSQL** es la única fuente de verdad y persistencia oficial del sistema.

Para el cliente piloto **MCI Santiago**, **Google Sheets** actúa como un **CMS operacional temporal** para que personal no técnico actualice la disponibilidad diaria, precios y stock del menú sin acceder al panel administrativo directo. **NUNCA** actúa como base de datos directa ni fuente de verdad.

El flujo de sincronización y lectura de datos se define así:

```
[ Administrador (MCI Santiago) ]
               ↓ (Modifica stock/disponibilidad/precio diario)
[       Google Sheets          ]
               ↓ (Lectura n8n / Flujo Preview & Apply)
[            n8n               ]
               ↓ (Llamada API validada)
[   Next.js API (Validación)   ]
               ↓ (Escritura via Repository)
[         PostgreSQL           ]
```

> [!IMPORTANT]
> La aplicación Next.js **nunca** debe consultar Google Sheets directamente. Toda la lectura de catálogo y estado se realiza desde PostgreSQL a través de la capa de servicios y repositorios, los cuales resuelven dinámicamente el catálogo maestro aplicando los overrides operacionales (`DailyMenuOverride`) de forma transparente.

---

## Estructura de Carpetas

La aplicación sigue los principios de **Clean Architecture** estructurada por dominios:

```
src/
├── app/                    ← Rutas Next.js (App Router)
│   ├── (marketing)/        ← Páginas públicas (ej. /menu)
│   ├── (dashboard)/        ← Panel administrativo privado
│   └── api/                ← API Routes (Route Handlers externos)
├── components/             ← Componentes React de UI (presentación pura)
│   ├── ui/                 ← Componentes base reutilizables (Base UI)
│   ├── layout/             ← Header, Footer, Sidebar
│   └── menu/               ← UI del catálogo digital
├── services/               ← Lógica de negocio (Casos de uso puros)
│   ├── products/           ← Gestión de catálogo y productos
│   ├── orders/             ← Gestión del flujo de pedidos
│   ├── payments/           ← Lógica de cobros y transacciones
│   ├── kitchen/            ← Preparación de comandas
│   ├── inventory/          ← Control de stock
│   ├── customers/          ← Gestión de clientes y fidelización
│   └── chat/               ← Orquestación de chatbot
├── repositories/           ← Capa de acceso a datos (Patrón Repository)
│   ├── interfaces/         ← Contratos / Puertos de persistencia (puros)
│   └── prisma/             ← Implementaciones / Adaptadores concretos de Prisma
├── integrations/           ← Adaptadores tecnológicos externos (n8n, Google, SumUp, Telegram, WhatsApp)
├── server/                 ← Singleton de base de datos (server-only)
├── config/                 ← Parámetros de configuración e isomórficos
├── lib/                    ← Utilidades compartidas y librerías transversales
└── types/                  ← Tipos de dominio puros de TypeScript (isomórficos)
```

## Release RC1

El proyecto ha sido promovido a **Release Candidate 1 (RC1)**. En esta etapa se declara estable el núcleo operativo de:

- Carta digital de autopedido mobile-first (`/menu`).
- Sistema de cola y preparación KDS Kanban (`/dashboard/kitchen`).
- Sincronización diaria del catálogo mediante Google Sheets y n8n.
- Pasarelas de cobro inyectables (SumUp y Webpay Plus) con webhooks criptográficos idempotentes.

---

## Configuración Inicial (Local)

### Prerrequisitos

- Node.js LTS (v20 o superior).
- npm v10 o superior.
- Base de datos PostgreSQL v15+ (opcional para desarrollo, el repositorio incluye un motor in-memory si la DB no está disponible).

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd satem-food-engine

# 2. Instalar dependencias
npm install

# 3. Copiar y configurar el archivo de variables de entorno
cp .env.example .env
# → Abre .env y ajusta los valores mínimos (DATABASE_URL, MENU_SYNC_SECRET)

# 4. Generar el cliente de Prisma ORM
npx prisma generate

# 5. Aplicar migraciones iniciales a PostgreSQL
npx prisma migrate dev

# 6. Cargar datos de demostración profesionales (idempotente)
npm run db:seed

# 7. Levantar servidor de desarrollo local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) en el navegador.

### Carga y Reinicio de Datos Demo

Para poblar o restablecer el entorno de base de datos con un dataset profesional completo (Organización, Locales, Usuarios asignados, Canales de venta, 27 Productos con modificadores obligatorios y opcionales, Inventario con stock inicial, Clientes, 8 Pedidos históricos en diversos estados con snapshots, Transacciones de pago y chats de prueba):

```bash
# Ejecutar el seed (idempotente)
npm run db:seed
```

_Nota: Este comando puede ejecutarse de manera reiterada. Los pedidos y mensajes del seed se purgan y recrean de forma limpia para evitar duplicidad, mientras que los datos maestros se actualizan mediante lógica `upsert`._

---

## Scripts Disponibles

| Script               | Descripción                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Inicia el servidor Next.js en modo desarrollo con hot-reload.      |
| `npm run build`      | Genera la compilación de producción optimizada (Turbopack).        |
| `npm run start`      | Arranca la aplicación Next.js compilada en producción.             |
| `npm run lint`       | Ejecuta el análisis estático de código con ESLint.                 |
| `npm run format`     | Corrige problemas de estilo en todo el proyecto mediante Prettier. |
| `npm run type-check` | Realiza la verificación de tipos de TypeScript sin compilar.       |
| `npm run test`       | Ejecuta las pruebas críticas de Vitest en modo monouso.            |

---

## Guía de Despliegue en Producción

Para desplegar esta release candidate en servidores externos:

1. Revise la [**Guía de Despliegue Completa** (DEPLOYMENT.md)](DEPLOYMENT.md) para configuraciones Docker, docker-compose, NGINX Reverse Proxy y Let's Encrypt HTTPS.
2. Siga el [**Manual de Operación** (OPERATIONS.md)](OPERATIONS.md) para conocer las rutinas diarias de soporte, administración del KDS y flujos de conciliación.
3. Consulte el [**Plan de Respaldo y Recuperación** (BACKUP_RECOVERY.md)](BACKUP_RECOVERY.md) para garantizar los RTO y RPO establecidos ante desastres.

---

## Contribución y Buenas Prácticas

1. **Regla de oro**: Lea [`AGENTS.md`](AGENTS.md) completo antes de programar o modificar lógica del dominio.
2. **TypeScript**: Strict true habilitado en `tsconfig.json`. Queda prohibido el uso de `any`.
3. **Eventos**: El pre-commit hook de Husky validará el formato de código y lint de manera automatizada.

---

## Licencia

Propietario — © SATEM. Todos los derechos reservados.
