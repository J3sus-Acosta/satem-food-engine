# Database / Prisma

**Responsabilidad:** gestionar Prisma schema, migraciones, relaciones, índices, constraints, queries e integridad (PostgreSQL).

## Antes de modificar `schema.prisma`

Analizar modelos, relaciones, foreign keys, índices, unique constraints, migraciones y datos existentes. Verificar si los campos nuevos realmente se consumen.

## Reglas

- **Nunca** cambios destructivos en producción sin autorización explícita (DROP, TRUNCATE, DELETE masivo, migraciones destructivas).
- No usar `prisma db push` contra producción; usar `prisma migrate`.
- No eliminar columnas/tablas/relaciones/índices sin determinar impacto; preferir cambios aditivos.
- Acceso a datos solo en repositorios / `src/server/` con `server-only`; nunca exponer objetos Prisma al cliente.
- Respetar reglas críticas: `OrderSequence` atómico, `ProductVersion` + `CatalogAuditLog` en cambios de catálogo, entidad `Location` reutilizada.
- Validar con `npx prisma validate`, `npx prisma generate`, `npx prisma migrate status`.
- No migrar PostgreSQL ↔ MySQL como parte de una feature normal.
