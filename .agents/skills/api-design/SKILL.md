---
name: api-design
description: Patrones de diseño para Route Handlers (API Routes), validaciones, manejo de errores y formato de respuestas (ApiResponse).
---

# API Design

## Propósito

Definir la estructura obligatoria de los Route Handlers en `src/app/api/` como contratos HTTP ligeros que comunican a clientes externos (n8n, bots) con la capa de servicios.

## Cuándo debe cargarse automáticamente

- Al crear o modificar un endpoint en `src/app/api/`.
- Al definir contratos HTTP para integraciones externas.

## Cuándo NO debe cargarse

- Al trabajar en Server Components (`page.tsx`) que deben consumir `services/` directamente.

## Responsabilidades

- Validación de input HTTP (cuerpo, query params).
- Parseo y formateo de respuestas usando el envoltorio estandarizado `ApiResponse<T>`.
- Captura de errores de dominio y conversión a códigos HTTP.

## Convenciones detectadas en el proyecto

- **No lógica de negocio:** Los Route Handlers _nunca_ contienen lógica de dominio. Solo extraen parámetros y llaman a funciones de `src/services/`.
- **Envoltorio estandarizado:** Todas las respuestas exitosas y de error utilizan el wrapper `ApiResponse<T>` de `src/types/index.ts`.
- **Estructura Try/Catch:** Todo Route Handler está envuelto en un `try/catch` que atrapa errores de dominio (ej. `NotFoundError`, `ValidationError`) provenientes de la capa de servicios.

## Patrones encontrados en el código

- El patrón de respuesta exitosa: `NextResponse.json({ data: result }, { status: 200 })`.
- El patrón de respuesta de error: `NextResponse.json({ error: err.message }, { status: 400 })`.
- Extracción de parámetros tipados (ej. extrayendo `status` o `type` en listas) sin reinventar la lógica de base de datos.

## Anti-patrones a evitar

- Llamar a `db.prisma` directamente desde un Route Handler.
- Devolver objetos de base de datos directos sin usar el wrapper `data: ...`.
- Ignorar errores (`catch {}`) o devolver un genérico `HTTP 500` cuando se trata de un error de validación (HTTP 400).
- Usar `fetch()` internamente en Server Components para llamar a nuestras propias API Routes (en su lugar, llamar al servicio directamente).

## Checklist antes de implementar cambios

- [ ] ¿Existe el tipo de retorno en `src/types/index.ts`?
- [ ] ¿El servicio subyacente ya expone la función necesaria?
- [ ] ¿Se validan todos los datos de entrada antes de enviarlos al servicio?

## Checklist antes de finalizar una tarea

- [ ] El endpoint está envuelto en un bloque `try/catch`.
- [ ] Los errores de dominio se mapean correctamente a códigos HTTP (400, 403, 404, 409).
- [ ] El tipo de retorno coincide con `ApiResponse<T>`.

## Referencias a archivos o carpetas reales

- Ejemplo de endpoint: `src/app/api/orders/route.ts`
- Tipos de API: `src/types/index.ts` (líneas 66-76, `ApiResponse<T>`)
- Errores: `src/lib/errors.ts`
