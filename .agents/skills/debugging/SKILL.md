---
name: debugging
description: Estrategias, convenciones y tipología de errores para diagnóstico y solución de problemas.
---

# Debugging y Manejo de Errores

## Propósito

Estandarizar cómo se levantan, atrapan y exponen los errores en todo el proyecto, minimizando fugas de información y asegurando una trazabilidad correcta.

## Cuándo debe cargarse automáticamente

- Al analizar stacktraces o resolver bugs complejos.
- Al escribir código defensivo y manejo de excepciones (`try/catch`).

## Convenciones de Errores (Dominio vs HTTP)

Los errores nativos de JavaScript (`Error`) se subclasifican en el dominio para ser interceptados por las capas externas.

- `NotFoundError`: El recurso no existe (HTTP 404).
- `ValidationError`: Datos mal formados (HTTP 400).
- `ConflictError`: Regla de negocio rota, como cancelar un pedido ya pagado (HTTP 409).
- `ForbiddenError`: Sin permisos (HTTP 403).
- `IntegrationError`: Falla un servicio externo (SumUp, n8n) (HTTP 502/500).

## Patrones

- **Logueo centralizado en Route Handlers:** Las APIs atrapan errores, loguean internamente con `console.error('[METHOD /api/path] Error:', err)`, y exponen un mensaje genérico o controlado al cliente.
- **Tipado de Errores:** TypeScript trata el bloque catch como `error: unknown`. El patrón usado es: `const err = error instanceof Error ? error : new Error(String(error))`.
- **Resiliencia DB:** En los repositorios (ej. `PrismaOrderRepository`), se usa `isConnectionError()` para detectar caídas de la DB y aplicar fallbacks temporales en memoria para entornos de desarrollo.

## Anti-patrones a evitar

- Crear "workarounds" para esquivar un error de base de datos en lugar de solucionar la causa real.
- Exponer detalles de la DB (stacktraces de Prisma) al cliente final (frontend o respuestas HTTP).
- Usar bloques `catch {}` vacíos que ocultan errores silenciosamente.

## Checklist de diagnóstico

- [ ] ¿El error se origina en el Servicio, el Repositorio o la Integración?
- [ ] ¿Se trata de una regla de negocio rota (`ConflictError`) o datos mal formados (`ValidationError`)?
- [ ] ¿Los logs revelan desconexión de DB (ej. `P1001`)?

## Referencias

- Clases de error: `src/lib/errors.ts`
- Implementación de resiliencia DB: `src/repositories/prisma/PrismaOrderRepository.ts`
