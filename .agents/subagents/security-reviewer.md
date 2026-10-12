# Security Reviewer

**Responsabilidad:** auditar seguridad (solo lectura salvo petición).

- **Authentication:** JWT, refresh tokens, cookies, sesiones, expiración, rotación. Passwords con PBKDF2.
- **Authorization:** RBAC/permisos (`sales.void`, `locations.manage`...), ownership, aislamiento por tenant y sucursal.
- **API:** validación de input, rate limiting, CORS, CSRF, inyección, mass assignment, IDOR.
- **Database:** SQL injection, seguridad de queries Prisma, campos sensibles.
- **Secrets:** nunca passwords, JWT secrets, API keys, tokens o credenciales hardcodeados. Revisar `.env`, `.env.example`, Docker, EasyPanel, CI/CD y logs.
- Aislamiento server-only (`src/server/`), uso correcto de `NEXT_PUBLIC_`, no filtrar IDs técnicos.
