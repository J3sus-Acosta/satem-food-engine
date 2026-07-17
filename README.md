# SATEM Food Engine

> Plataforma SaaS para restaurantes, cafeterías y food trucks — carta digital, chatbot de pedidos, pagos y gestión de inventario, todo integrado con n8n.

---

## Visión General

SATEM Food Engine es una plataforma multi-tenant construida para modernizar la operación de negocios de comida. Permite a cualquier restaurante, cafetería o food truck tener presencia digital completa en minutos: una carta interactiva en línea, un chatbot que toma pedidos en lenguaje natural, cobro integrado y automatización de cocina e inventario.

### Problema que resuelve

La mayoría de los pequeños negocios de comida opera con procesos manuales fragmentados: WhatsApp para pedidos, Excel para inventario, papel para comandas. SATEM Food Engine unifica todo en una sola plataforma, reduciendo errores, tiempos de espera y costos operacionales.

### Funcionalidades core (roadmap)

| Módulo           | Descripción                                             | Estado       |
| ---------------- | ------------------------------------------------------- | ------------ |
| 📋 Carta Digital | Menú interactivo con categorías, imágenes y precios     | 🔜 Pendiente |
| 🤖 Chatbot       | Bot web en lenguaje natural para recibir pedidos        | 🔜 Pendiente |
| 💳 Pagos         | Integración con pasarela de pago (Stripe / MercadoPago) | 🔜 Pendiente |
| 🍳 Comandas      | Envío automático de pedidos a cocina vía n8n            | 🔜 Pendiente |
| 📦 Inventario    | Control de stock con alertas automáticas de reposición  | 🔜 Pendiente |
| 🏪 Multi-local   | Soporte para múltiples locales bajo una misma cuenta    | 🔜 Pendiente |
| 📊 Reportes      | Panel de analíticas de ventas y rendimiento             | 🔜 Pendiente |

---

## Stack Tecnológico

| Capa           | Tecnología                               |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 16 (App Router)                  |
| UI Library     | React 19                                 |
| Lenguaje       | TypeScript 5 (strict mode)               |
| Estilos        | Tailwind CSS 4                           |
| Componentes UI | shadcn/ui                                |
| ORM            | Prisma (preparado para PostgreSQL)       |
| Automatización | n8n (self-hosted)                        |
| Linting        | ESLint 9 + eslint-config-next            |
| Formateo       | Prettier 3 + prettier-plugin-tailwindcss |
| Git Hooks      | Husky + lint-staged                      |
| Runtime        | Node.js LTS                              |

---

## Arquitectura

La aplicación es un **monolito full-stack** construido íntegramente con Next.js App Router. No existe un backend separado.

```
src/
├── app/                    ← Rutas Next.js (App Router)
│   ├── (marketing)/        ← Carta pública, landing, menú
│   ├── (dashboard)/        ← Panel admin del restaurante
│   └── api/                ← API Routes (Route Handlers)
├── components/
│   ├── ui/                 ← shadcn/ui (primitivos reutilizables)
│   ├── layout/             ← Header, Footer, Sidebar, Nav
│   ├── chat/               ← Componentes del chatbot
│   ├── menu/               ← Componentes de carta digital
│   └── orders/             ← Componentes de pedidos
├── services/               ← Lógica de negocio pura
│   ├── chat/
│   ├── orders/
│   ├── products/
│   ├── payments/
│   ├── inventory/
│   ├── google/
│   └── n8n/
├── server/                 ← Código exclusivo del servidor
│   └── db.ts               ← Cliente Prisma (singleton server-only)
├── config/                 ← Constantes y configuración de la app
├── lib/                    ← Utilidades compartidas (isomórficas)
├── hooks/                  ← Custom React hooks
└── types/                  ← Definiciones TypeScript globales
```

### Principios Arquitectónicos

- **Sin lógica de negocio en componentes React.** Los componentes solo renderizan UI y manejan estado de presentación. Toda la lógica de negocio vive en `services/`.
- **Server Components por defecto.** Solo se usa `'use client'` cuando se necesita interactividad real (estado, eventos, APIs del navegador).
- **`server-only` boundary.** Todo código que no debe llegar al cliente (Prisma, API keys, etc.) vive en `src/server/` e importa `server-only`.
- **API Routes como contrato.** La UI nunca llama directamente a servicios desde el cliente — usa Route Handlers en `app/api/`.
- **n8n para automatización.** Los flujos complejos (comandas, alertas, notificaciones) se orquestan desde n8n, no desde la app.

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
