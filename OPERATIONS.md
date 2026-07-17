# Manual de Operaciones — SATEM Food Engine

Este manual describe las tareas cotidianas de monitoreo, mantenimiento y administración del sistema SATEM Food Engine en entornos de producción.

---

## 1. Comandos de Control del Ciclo de Vida

Operaciones para levantar y apagar la plataforma mediante Docker Compose:

```bash
# Iniciar la aplicación y la DB en segundo plano
docker compose up -d

# Detener los servicios sin borrar datos
docker compose stop

# Detener y remover los contenedores y redes
docker compose down

# Ver logs de la aplicación en tiempo real
docker compose logs -f app
```

---

## 2. Acceso Operativo y Consola

Para interactuar directamente con la base de datos de producción:

```bash
# Acceder a la consola interactiva de PostgreSQL
docker compose exec db psql -U satem_user -d satem_db

# Abrir Prisma Studio localmente para edición directa de tablas (Puerto 5555)
# (Recomendado solo para soporte en redes privadas mediante túnel SSH)
npx prisma studio
```

---

## 3. Sincronización Automática (Google Sheets Sync + n8n)

La carta de MCI Santiago se sincroniza diariamente desde el archivo Google Sheets a las **08:00 AM** a través del flujo **n8n Workflow 01** (`01-menu-sync.json`).

### Fallas en Sincronización:

Si el menú no se actualiza, verifique en el panel de n8n:

1. Que el webhook devuelva HTTP 200. Si devuelve HTTP 401, el secreto de sincronización `x-menu-sync-secret` está desalineado entre n8n y `.env`.
2. Si el webhook devuelve HTTP 400, verifique los logs de `app` para identificar el SKU/Código duplicado o mal configurado en la hoja de cálculo.
3. Si n8n reporta fallas de conexión, valide que la variable de entorno `NEXT_PUBLIC_APP_URL` esté correctamente configurada en la instancia de n8n.

---

## 4. Reset del Menú Diario (Mantenimiento Nocturno)

Cada noche a las **02:00 AM**, el flujo **n8n Workflow 04** (`04-nightly-maintenance.json`) envía una petición POST a `/api/menu/reset-daily` con el secreto de firma.
Esto elimina todos los registros de la tabla `daily_menu_overrides` en la base de datos de PostgreSQL, forzando a que la carta pública consuma los precios y stocks base del catálogo al comenzar la jornada, preparándose para la sincronización de las 08:00 AM.

---

## 5. Monitoreo de Alertas de Stock Bajo

El flujo **n8n Workflow 05** (`05-low-stock-alert.json`) consulta cada hora la API `/api/inventory/low-stock`.

- Actualmente, devuelve un arreglo vacío seguro (`alerts: []`) para evitar ruidos de error 404 en el log de n8n.
- Al implementar el servicio de inventario real en fases futuras, este workflow enviará alertas automáticas a canales de soporte cuando los ingredientes crucen el stock mínimo configurado.

---

## 6. Operación del KDS (Kitchen Display System)

Los cocineros de MCI Santiago gestionan la preparación de pedidos desde la pantalla Kanban `/dashboard/kitchen`.

### Ciclo Operativo Correcto:

1. **Pedidos Pagados**: Al confirmarse el pago por webhook, el pedido cambia de estado a `CONFIRMED` y aparece automáticamente en la columna de pendientes en el KDS.
2. **Inicio de Cocina**: El operador presiona "Preparar", cambiando la tarjeta a `PREPARING` (registra la hora de inicio).
3. **Pedido Listo**: Al completar la preparación, presiona "Listo". La tarjeta pasa a `READY` y desaparece del KDS. El cliente ve en su pantalla de tracking `/menu/track` que su pedido está listo para retiro.
4. **Entrega de Comanda**: Al entregar físicamente la comanda, el cajero o cocinero marca "Entregado", cerrando el flujo en `DELIVERED`.

---

## 7. Problemas Comunes y Mitigación

### El pedido del cliente se queda en PENDING indefinidamente:

- **Causa**: El webhook del procesador de pagos (SumUp/Webpay) no pudo entregar la confirmación del pago al servidor Next.js.
- **Mitigación**:
  1. Revise los logs del contenedor para verificar si la firma del webhook falló (ej. `Invalid webhook signature`).
  2. Si es necesario, apruebe la orden manualmente llamando al endpoint PATCH `/api/orders/[id]` con `{ "action": "confirm" }` para que aparezca de inmediato en la cocina.

### Errores Prisma P2002 (Unique Constraint):

- El sistema cuenta con reintentos automáticos para el cálculo concurrente de números correlativos de pedido (`#001`). Si ve este error repetidamente en los logs, indica un nivel insostenible de concurrencia y se recomienda revisar los tiempos de respuesta de la base de datos.

---

## 8. Rutinas de Mantenimiento

### Diario:

- [ ] Validar que la sincronización de las 08:00 AM haya cargado correctamente el menú diario sin errores de formato.
- [ ] Revisar el estado de los contenedores Docker (`docker ps`).

### Semanal:

- [ ] Verificar espacio en disco del servidor (`df -h`).
- [ ] Validar que el archivo de logs del sistema no esté saturando el almacenamiento (configurar Logrotate si es necesario).

### Mensual:

- [ ] Realizar una prueba de restauración de base de datos en un entorno de desarrollo para validar la integridad del backup.
- [ ] Limpiar imágenes Docker huérfanas (`docker system prune -f`).
