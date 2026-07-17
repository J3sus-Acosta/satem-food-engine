---
name: postgresql-prisma
description: Patrones de acceso a datos, esquemas relacionales y manejo de conexión a PostgreSQL vía Prisma ORM.
---

# PostgreSQL y Prisma ORM

## Propósito

Definir las mejores prácticas y patrones observados en el manejo de base de datos usando PostgreSQL y Prisma en el proyecto.
_(Nota: Este Skill reemplaza al antiguo `mysql-patterns` ya que la base de datos real del proyecto es PostgreSQL)._

## Cuándo debe cargarse automáticamente

- Al modificar `prisma/schema.prisma`.
- Al escribir o modificar un Repositorio en `src/repositories/prisma/`.
- Al implementar modelos relacionales o realizar migraciones.

## Convenciones detectadas

- **Base de Datos:** PostgreSQL.
- **Tipos Base:**
  - Los IDs utilizan CUIDs (`@default(cuid())`).
  - Todo monto monetario se guarda como `Decimal(10,2)`.
  - El motor subyacente maneja tipos Decimales, pero el dominio usa el alias `Money` (number), la capa de repositorio se encarga de la conversión.
- **Singletons y Edge:** Existe un archivo `src/server/db.ts` que exporta un Singleton de Prisma. Está marcado con `import 'server-only'` y se recicla en modo desarrollo para evitar agotar el pool de conexiones en Next.js.
- **Resiliencia de Conexión:** En desarrollo se detectó el patrón `isConnectionError(error)` para capturar fallos como desconexiones (`P1001`, `ECONNREFUSED`) y habilitar temporalmente variables de fallback (ej: `IN_MEMORY_ORDERS`) si la DB local no está corriendo.

## Patrones

- Todos los modelos tienen `createdAt`, `updatedAt` y opcionalmente `deletedAt` para soft deletes.
- Repositorios aislados: No se exporta `db` o entidades directas de Prisma fuera de la capa `src/repositories/prisma/`. Los métodos devuelven interfaces de dominio puras (ej. `Order`), desacoplando los servicios del ORM subyacente.

## Anti-patrones a evitar

- Utilizar `prisma db push` en entornos de producción (siempre usar `prisma migrate`).
- Acoplar componentes de UI a tipos generados por Prisma (`@prisma/client`). Siempre usar los tipos intermedios de `src/types/index.ts`.

## Referencias

- Configuración de Singleton: `src/server/db.ts`
- Schema DB: `prisma/schema.prisma`
- Ejemplo de Repositorio Resiliente: `src/repositories/prisma/PrismaOrderRepository.ts`
