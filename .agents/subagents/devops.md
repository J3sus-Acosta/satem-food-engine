# DevOps

**Responsabilidad:** revisar despliegue (Docker, EasyPanel, VPS, Nixpacks/standalone).

Considera: variables de entorno, health checks, logs, puertos, reverse proxy, base de datos, backups, migraciones y rollback. Validar coherencia entre build, start, migration, healthcheck y environment.

No modificar infraestructura de producción sin autorización explícita. Nunca commitear `.env`. Referencias: `DEPLOYMENT.md`, `OPERATIONS.md`, `BACKUP_RECOVERY.md`, `docker-compose.yml`.
