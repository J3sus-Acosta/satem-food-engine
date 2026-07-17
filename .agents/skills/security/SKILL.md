---
name: security
description: Prácticas de seguridad en el aislamiento de Server Components y variables de entorno.
---

# Security

## Propósito

Prevenir filtración de datos sensibles, ataques por inyección o exposición de dependencias de backend al entorno del navegador del usuario.

## Cuándo debe cargarse automáticamente

- Al implementar autenticación y flujos de autorización (`UserRole`, accesos).
- Al importar o modificar variables de entorno `.env`.
- Al escribir código relacionado con pagos (`PaymentService`).

## Convenciones detectadas en el proyecto

- **Barrera de Servidor (`server-only`):** Todos los archivos de acceso a base de datos (`src/server/db.ts`), repositorios y servicios principales inician con `import 'server-only'`. Esto lanza un error en tiempo de compilación (Webpack) si un desarrollador accidentalmente lo importa desde un Client Component (`'use client'`).
- **Variables Públicas:** Las variables de entorno que el frontend necesita leer DEBEN iniciar obligatoriamente con el prefijo `NEXT_PUBLIC_` (ej. `NEXT_PUBLIC_APP_URL`). Cualquier otra variable es considerada secreto.
- **Aislamiento Multi-Tenant:** Las tablas de la base de datos dividen la información mediante `organizationId` y `locationId`. Las consultas en Repositorios siempre deben incluir filtros de Tenant explícitos para prevenir escalada horizontal (ver los datos de otro restaurante).

## Anti-patrones a evitar

- Confiar ciegamente en parámetros provenientes del Body HTTP de un API Route sin validar (validación con Zod es obligatoria a futuro).
- Enviar objetos completos de la Base de Datos (`PrismaOrder`) hacia un Client Component que pueda contener datos sensibles no mostrados en la interfaz. Extraer/Mapear a interfaces públicas de `src/types/index.ts` antes de devolver la respuesta o pasar las props.
