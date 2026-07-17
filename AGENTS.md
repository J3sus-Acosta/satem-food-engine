# AGENTS.md — Reglas para Agentes de IA

> Este archivo define las reglas que **cualquier agente de IA** (Claude, Gemini, Copilot, Cursor, etc.) debe seguir al trabajar en este repositorio. Estas reglas tienen prioridad sobre el conocimiento previo del agente.

---

## 0. Antes de escribir cualquier código

1. **Lee los docs de Next.js locales** en `node_modules/next/dist/docs/` antes de usar cualquier API.  
   Esta versión puede tener cambios que difieren de tu entrenamiento. Sigue los docs, no tu memoria.
2. **Lee este archivo completo** antes de proponer cualquier cambio.
3. **Confirma la tarea** con el usuario si hay ambigüedad antes de ejecutar.

---

## 1. Arquitectura Obligatoria

### 1.1 Monolito Full-Stack con Next.js App Router

- **No existe un backend separado.** Toda la lógica de servidor vive en Next.js.
- Las API externas se consumen desde `services/` (server-side) o desde Route Handlers.
- Los Route Handlers (`app/api/**/route.ts`) son el contrato de la API HTTP.

### 1.2 Estructura de Capas

```
Componentes React  →  [presentación solamente, nunca lógica de negocio]
        ↓
  Route Handlers   →  [app/api/**/route.ts — entrada HTTP, validación, respuesta]
        ↓
    Services       →  [src/services/** — lógica de negocio pura]
        ↓
   Server Layer    →  [src/server/db.ts — acceso a datos, server-only]
        ↓
  Base de Datos    →  [PostgreSQL vía Prisma]
```

### 1.3 Regla Absoluta: Sin Lógica de Negocio en Componentes React

❌ **PROHIBIDO:**

```tsx
// MAL: lógica de negocio dentro del componente
export default function OrderCard({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        // Cálculos de negocio aquí ← INCORRECTO
        const total = data.items.reduce((sum, item) => sum + item.price * item.qty, 0)
        setOrder({ ...data, total })
      })
  }, [orderId])
  // ...
}
```

✅ **CORRECTO:**

```tsx
// BIEN: el componente solo muestra datos que recibe como props
interface OrderCardProps {
  order: Order // datos ya procesados por el servicio
}

export function OrderCard({ order }: OrderCardProps) {
  return <div>{order.total}</div>
}
```

---

## 2. Estructura de Carpetas

```
src/
├── app/                    ← SOLO rutas Next.js
│   ├── (marketing)/        ← Grupo de rutas públicas (carta, landing)
│   ├── (dashboard)/        ← Grupo de rutas admin (protegidas en el futuro)
│   ├── api/                ← Route Handlers — SOLO entrada/salida HTTP
│   ├── globals.css         ← Estilos globales + variables CSS
│   ├── layout.tsx          ← Root layout (Server Component)
│   └── page.tsx            ← Home page
├── components/
│   ├── ui/                 ← shadcn/ui y primitivos sin lógica de dominio
│   ├── layout/             ← Header, Footer, Sidebar, Nav
│   ├── chat/               ← UI del chatbot (Client Components)
│   ├── menu/               ← UI de la carta digital
│   └── orders/             ← UI de pedidos
├── services/               ← Lógica de negocio. UN servicio por dominio.
│   ├── chat/
│   ├── orders/
│   ├── products/
│   ├── payments/
│   ├── inventory/
│   ├── google/
│   └── n8n/
├── server/                 ← Server-only. Nunca importar desde Client Components.
│   └── db.ts               ← Cliente Prisma (singleton)
├── config/                 ← Constantes de la app (isomórficas)
├── lib/                    ← Utilidades compartidas (isomórficas)
├── hooks/                  ← Custom React hooks (Client-side)
└── types/                  ← Tipos TypeScript globales
```

### Reglas de ubicación

| ¿Dónde poner X?                    | Carpeta correcta                   |
| ---------------------------------- | ---------------------------------- |
| Lógica de negocio                  | `src/services/<dominio>/`          |
| Componente usado en 1 sola ruta    | Colocado junto a la ruta en `app/` |
| Componente compartido entre rutas  | `src/components/<categoría>/`      |
| Acceso a Prisma / DB               | `src/server/` ÚNICAMENTE           |
| Constante de URL o nombre de app   | `src/config/index.ts`              |
| Función util pura sin side effects | `src/lib/`                         |
| Hook de React                      | `src/hooks/`                       |
| Endpoint HTTP                      | `src/app/api/<recurso>/route.ts`   |
| Tipo TypeScript compartido         | `src/types/index.ts`               |

---

## 3. Server vs Client Components

### 3.1 Por defecto: Server Component

Todos los archivos en `app/` son Server Components por defecto. **No añadas `'use client'` a menos que sea estrictamente necesario.**

### 3.2 Cuándo usar `'use client'`

Solo cuando el componente necesita:

- `useState` / `useReducer`
- `useEffect` / `useLayoutEffect`
- Handlers de eventos (`onClick`, `onChange`, etc.)
- APIs del navegador (`localStorage`, `window`, `navigator`)
- Hooks de terceros que usan lo anterior

### 3.3 Patrón recomendado

Empuja los `'use client'` hacia las hojas del árbol de componentes:

```tsx
// page.tsx — Server Component (fetch datos aquí)
export default async function MenuPage() {
  const products = await getProducts() // desde services/
  return <MenuGrid products={products} /> // pasa datos como props
}

// components/menu/MenuGrid.tsx — Server Component si es posible
// components/menu/AddToCartButton.tsx — Client Component (tiene onClick)
```

### 3.4 Server-only

Cualquier módulo que acceda a secretos, base de datos, o APIs privadas debe estar en `src/server/` e importar `server-only`:

```ts
import 'server-only' // línea 1 obligatoria en todo archivo de src/server/
```

---

## 4. Principios SOLID

### S — Single Responsibility

Cada función, clase o módulo tiene **una única razón para cambiar**.

- Un servicio = un dominio (orders, products, payments…).
- Un componente = una responsabilidad de presentación.

### O — Open/Closed

Diseña para extensión, no para modificación.

- Usa parámetros de configuración y callbacks antes de modificar código existente.
- Los servicios deben ser extensibles sin romper sus consumidores.

### L — Liskov Substitution

Los tipos derivados deben poder sustituir a sus tipos base.

- Respetar los contratos de tipos; no hacer narrowing silencioso.

### I — Interface Segregation

Interfaces pequeñas y específicas, no interfaces monolíticas.

- Divide los types grandes en types más pequeños y componibles.

### D — Dependency Inversion

Depende de abstracciones, no de implementaciones concretas.

- Los servicios reciben sus dependencias como parámetros cuando sea posible.
- Facilita el testing unitario sin mocks complejos.

---

## 5. Clean Code

### Naming

| Elemento               | Convención                      | Ejemplo                          |
| ---------------------- | ------------------------------- | -------------------------------- |
| Componentes React      | PascalCase                      | `OrderCard`, `MenuGrid`          |
| Funciones/variables    | camelCase                       | `getOrderById`, `isLoading`      |
| Constantes             | SCREAMING_SNAKE_CASE            | `MAX_ORDER_ITEMS`, `API_TIMEOUT` |
| Archivos de componente | PascalCase                      | `OrderCard.tsx`                  |
| Archivos de utilidad   | kebab-case                      | `format-currency.ts`             |
| Archivos de ruta       | kebab-case (convención Next.js) | `page.tsx`, `route.ts`           |
| Tipos/Interfaces       | PascalCase                      | `Order`, `ProductCategory`       |
| Enums (type unions)    | PascalCase para el tipo         | `OrderStatus = 'pending'         | ...` |

### Funciones

- Nombres verbales que describen la acción: `createOrder`, `calculateTotal`, `sendComanda`.
- Máximo **20 líneas** por función. Si es más, extraer.
- Sin efectos secundarios ocultos (principio de mínima sorpresa).
- Retorna un solo tipo (no `Product | null | undefined`; usa `Product | null`).

### Comentarios

- No comentar **qué** hace el código (el código lo dice).
- Sí comentar **por qué** se tomó una decisión no obvia.
- JSDoc obligatorio en funciones exportadas de `services/`.

### Imports

- Siempre usar el alias `@/` para imports absolutos (configurado en `tsconfig.json`).
- Orden de imports: `react` → librerías externas → imports de `@/` → tipos.
- No usar imports relativos que suban más de un nivel (`../../`).

---

## 6. TypeScript

- **`strict: true` siempre.** Sin excepciones.
- **Nunca usar `any`.** Usa `unknown` + type guard si el tipo es desconocido.
- **Nunca usar `!` (non-null assertion)** sin un comentario que justifique por qué es seguro.
- Tipos en `src/types/index.ts` para los compartidos globalmente.
- Tipos de dominio específico colocados junto a su servicio.
- Prefiere `type` sobre `interface` para aliases simples; `interface` para estructuras extensibles.

---

## 7. Route Handlers (API Routes)

Estructura obligatoria de un Route Handler:

```ts
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/services/orders'
import type { ApiResponse } from '@/types'

// 1. Validar input (zod u otra librería)
// 2. Llamar al servicio correspondiente
// 3. Retornar respuesta tipada

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // TODO: validar body con zod

    const order = await createOrder(body)
    return NextResponse.json<ApiResponse<typeof order>>({ data: order }, { status: 201 })
  } catch (error) {
    return NextResponse.json<ApiResponse<never>>(
      { error: 'Error al crear el pedido' },
      { status: 500 }
    )
  }
}
```

**Reglas de Route Handlers:**

- Validar SIEMPRE el input del usuario antes de pasarlo a servicios.
- Nunca escribir lógica de negocio en el Route Handler.
- Retornar siempre `ApiResponse<T>` del tipo en `src/types/index.ts`.
- Manejar errores explícitamente con bloques `try/catch`.
- No mezclar `page.tsx` y `route.ts` en el mismo segmento de ruta.

---

## 8. Servicios

Estructura obligatoria de un servicio:

```ts
// src/services/orders/index.ts
import 'server-only' // si accede a DB o secretos
import { db } from '@/server/db'
import type { Order, OrderStatus } from '@/types'

/**
 * Crea un nuevo pedido en el sistema.
 * @param items - Lista de ítems del pedido
 * @returns El pedido creado
 */
export async function createOrder(items: OrderItem[]): Promise<Order> {
  // lógica de negocio aquí
}
```

**Reglas de Servicios:**

- Un archivo `index.ts` por dominio como barrel export.
- JSDoc obligatorio en todas las funciones exportadas.
- Sin imports de componentes React (`no jsx/tsx en services/`).
- Sin lógica HTTP (no usar `fetch` directamente para llamadas internas).
- Funciones puras cuando sea posible (testables sin setup complejo).

---

## 9. Prisma y Base de Datos

- Toda interacción con la DB ocurre **únicamente** en `src/server/db.ts` y servicios que importen `server-only`.
- Nunca importar `db` desde un Client Component o desde `src/lib/`.
- Definir modelos en `prisma/schema.prisma` antes de escribir código de servicio.
- Usar migraciones (`prisma migrate dev`) en lugar de `prisma db push` para producción.
- Nunca exponer objetos Prisma completos al cliente — mapear a tipos públicos antes.

---

## 10. Estilos (Tailwind CSS 4)

- Tailwind CSS 4 usa `@import "tailwindcss"` en CSS, **no** un archivo `tailwind.config.js`.
- La configuración de tema se realiza con `@theme` en CSS.
- Usar siempre las clases de shadcn/ui antes de escribir CSS custom.
- No mezclar estilos inline con Tailwind en el mismo elemento.
- El orden de las clases Tailwind es gestionado automáticamente por `prettier-plugin-tailwindcss`.

---

## 11. Prohibiciones Absolutas

❌ Nunca colocar lógica de negocio en componentes React.  
❌ Nunca importar `src/server/` desde Client Components.  
❌ Nunca usar `any` en TypeScript.  
❌ Nunca llamar directamente a la DB desde Route Handlers (pasar por servicios).  
❌ Nunca comitear `.env` (solo `.env.example`).  
❌ Nunca usar `console.log` en código de producción (usar un logger estructurado).  
❌ Nunca ignorar errores con catch vacíos (`catch {}`).  
❌ Nunca añadir `'use client'` en archivos de `src/server/`.  
❌ Nunca mezclar `page.tsx` y `route.ts` en el mismo segmento de ruta.

---

## 12. Checklist Pre-Commit

Antes de hacer commit, verificar:

- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run lint` pasa sin warnings
- [ ] `npm run build` compila sin errores (en cambios de arquitectura)
- [ ] No hay `any`, `// @ts-ignore` ni `eslint-disable` sin justificación
- [ ] Los nuevos servicios tienen JSDoc en funciones exportadas
- [ ] Los nuevos archivos siguen las convenciones de naming
- [ ] `.env` no fue modificado (solo `.env.example` si corresponde)
