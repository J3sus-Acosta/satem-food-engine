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
| **FASE 7**   | **Menú Operacional + Google Sheets CMS**   | Sincronización diaria del menú y disponibilidad mediante códigos cortos y n8n para MCI Santiago.                                                 | 🏃 En Curso   |
| **FASE 8**   | **Inventario**                             | Control e incremento/decremento automático de stock.                                                                                             | 🔜 Pendiente  |
| **FASE 9**   | **Chatbot IA**                             | Interacción conversacional (consumidor de servicios de dominio).                                                                                 | 🔜 Pendiente  |

---

## Stack Tecnológico

| Capa           | Tecnología                         |
| -------------- | ---------------------------------- |
| Framework      | Next.js 15 (App Router)            |
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

### Principios Arquitectónicos

- **Sin lógica de negocio en componentes React.** Los componentes solo renderizan UI y manejan estado de presentación. Toda la lógica de negocio vive en `services/`.
- **Server Components por defecto.** Solo se usa `'use client'` cuando se necesita interactividad real (estado, eventos, APIs del navegador).
- **`server-only` boundary.** Todo código que no debe llegar al cliente (Prisma, API keys, etc.) vive en `src/server/` o `src/repositories/prisma/` e importa `server-only`.
- **Llamadas directas en el servidor.** Los Server Components consumen directamente los servicios de dominio de `src/services/` sin realizar peticiones HTTP innecesarias.
- **API Routes como contratos externos.** Las API Routes de Next.js existen únicamente para integraciones externas (Chatbot, n8n, WhatsApp, Telegram, etc.).
- **n8n para automatización e integración.** Las integraciones asíncronas y flujos complejos de sincronización (como el CMS de Google Sheets) son responsabilidad de n8n.

---

## Configuración Inicial

### Prerrequisitos

- Node.js LTS (≥ 20)
- npm ≥ 10
- PostgreSQL (para desarrollo activo con base de datos)

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd satem-food-engine

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# → Edita .env con tus valores reales

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

### Scripts disponibles

| Script               | Descripción                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Servidor de desarrollo con hot-reload    |
| `npm run build`      | Build de producción                      |
| `npm run start`      | Inicia el servidor de producción         |
| `npm run lint`       | Ejecuta ESLint                           |
| `npm run lint:fix`   | Ejecuta ESLint con auto-fix              |
| `npm run format`     | Formatea todos los archivos con Prettier |
| `npm run type-check` | Verifica TypeScript sin compilar         |

### Base de datos (Prisma)

```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración inicial (cuando haya modelos definidos)
npx prisma migrate dev --name init

# Abrir Prisma Studio
npx prisma studio
```

---

## Variables de Entorno

Todas las variables necesarias están documentadas en [`.env.example`](.env.example).

> ⚠️ Nunca comitees `.env`. Solo `.env.example` debe estar en el repositorio.

---

## Contribución

1. Lee [`AGENTS.md`](AGENTS.md) antes de escribir cualquier código.
2. Las ramas deben seguir el formato: `feat/`, `fix/`, `chore/`, `docs/`.
3. El pre-commit hook ejecutará ESLint + Prettier automáticamente.
4. Usa `npm run type-check` antes de hacer push.

---

## Primer cliente

**Food Truck MCI Santiago** — primera instalación de referencia del sistema.

---

## Licencia

Propietario — © SATEM. Todos los derechos reservados.
