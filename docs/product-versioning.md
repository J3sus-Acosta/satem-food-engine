# Versionado y Snapshots de Catálogo (Fase 10B)

SATEM Food Engine incorpora un sistema estricto de control de versiones y auditoría para el catálogo maestro de productos. Cada cambio estructural genera automáticamente un registro histórico que permite recuperar el estado exacto del producto en cualquier punto del tiempo.

---

## Estrategia de Versionado (Snapshots)

A diferencia de los sistemas basados en diferencias (diffs), el motor de catálogo utiliza una estrategia de **Snapshots Completos**.

### Ventajas de los Snapshots Completos

1. **Velocidad de Recuperación**: Revertir a una versión anterior no requiere reconstruir secuencialmente un historial de parches; se lee el snapshot completo del JSON y se aplica directamente a las tablas.
2. **Inmunidad a Cambios de Estructura**: Si el modelo de datos evoluciona, las versiones antiguas se mantienen válidas como estructuras cerradas autónomas.
3. **Fácil Auditoría**: Permite inspeccionar visualmente de forma instantánea el estado exacto del producto en una fecha determinada.

---

## Modelo de Datos y Ciclo de Vida

El control de versiones se sustenta en dos modelos en `schema.prisma`:

- `ProductVersion`: Almacena snapshots completos estructurados en JSON (atributos, variantes, modificadores e insumos).
- `CatalogAuditLog`: Registra los eventos operacionales del ciclo de vida (`"CREATED"`, `"UPDATED"`, `"DELETED"`, `"RESTORED"`, `"VERSION_RESTORED"`, `"DUPLICATED"`).

### Cuándo se capturan las versiones

1. **Creación**: Se genera la Versión 1 como snapshot del estado inicial creado.
2. **Modificación**: **Antes** de aplicar la modificación en la base de datos, se toma un snapshot del estado _actual_ y se guarda como versión $N+1$.
3. **Eliminación y Restauración**: Se captura un snapshot de seguridad antes de marcar el producto como eliminado.

---

## Proceso de Restauración Rápida (Rollback)

Cuando un administrador selecciona una versión anterior para restaurarla:

1. Se recupera el snapshot de `ProductVersion` correspondiente.
2. Se toma una versión de resguardo del estado _actual_ del producto (para poder deshacer la restauración si fuera necesario).
3. Se actualizan atómicamente en una transacción Prisma los atributos base, variantes, modificadores e insumos asociando los valores guardados en el snapshot.
4. Se registra el evento `"VERSION_RESTORED"` documentando el número de versión de origen en la auditoría.
