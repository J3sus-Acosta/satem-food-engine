---
name: docker-easypanel
description: Convenciones de despliegue y estado de la infraestructura en Docker/EasyPanel.
---

# Infraestructura (Docker / EasyPanel)

## Propósito

Definir las convenciones arquitectónicas para el futuro despliegue de SATEM Food Engine mediante Docker en la plataforma EasyPanel.

## Cuándo debe cargarse automáticamente

- Al momento de preparar el proyecto para paso a producción.
- Al escribir o modificar un `Dockerfile` o configuración de orquestación.

## Estado de Implementación

> **ATENCIÓN:** Actualmente no existen archivos `Dockerfile` o `docker-compose.yml` en la raíz del proyecto. Este Skill documenta las convenciones que **deben seguirse** cuando se implementen, pero no inventa configuraciones que no existen en el código real.

## Convenciones (Pendientes de implementación)

- **Standalone Mode:** El framework es Next.js App Router (v15). El build futuro debe apuntar al formato `output: 'standalone'` en `next.config.ts` para despliegues optimizados en Docker.
- **EasyPanel Variables:** Las variables de entorno críticas (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, tokens) deberán mapearse en la interfaz de EasyPanel, sin exponer el `.env` en los repositorios.
- **Persistencia de Base de Datos:** PostgreSQL está configurado nativamente mediante Prisma. EasyPanel se encargará de gestionar el volumen del servicio PostgreSQL de forma independiente al ciclo de vida del contenedor de Next.js.
- **Node.js Environment:** `NODE_ENV` siempre debe ser `production` en el entorno de despliegue de EasyPanel.

## Anti-patrones a evitar

- Crear Dockerfiles monolíticos que ignoren el cacheo de dependencias de Node.js.
- Hacer deploy sin aplicar primero las migraciones de Prisma (`prisma migrate deploy`).

## Referencias

- Configuración de framework: `next.config.ts`.
- Variables de entorno actuales: `.env.example`.
