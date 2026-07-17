# Plan de Backups y Recuperación ante Desastres (DRP)

Este documento define la política de respaldo, tiempos de recuperación y el plan de acción detallado ante pérdida de datos o indisponibilidad en SATEM Food Engine.

---

## 1. Métricas Operativas (Objetivos)

- **RPO (Recovery Point Objective)**: **4 horas**. Máxima pérdida de datos tolerada (transacciones comerciales y pedidos).
- **RTO (Recovery Time Objective)**: **30 minutos**. Máximo tiempo tolerado para restaurar el servicio tras un desastre total de infraestructura.

---

## 2. Estrategia de Respaldo (Backup)

### PostgreSQL (Base de Datos Central)

Se debe configurar un cronjob en el servidor principal para ejecutar un dump de la base de datos cada 4 horas y transferirlo a un almacenamiento externo seguro (ej. AWS S3 o MinIO).

#### Script de Respaldo (`/opt/satem/scripts/backup-db.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/satem"
DATE=$(date +%F_%H%M%S)
FILE_NAME="satem_prod_${DATE}.sql.gz"
CONTAINER_NAME="satem-food-engine-db"
DB_USER="satem_user"
DB_NAME="satem_db"

mkdir -p $BACKUP_DIR

# Ejecutar pg_dump y comprimir en la marcha
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME | gzip > "${BACKUP_DIR}/${FILE_NAME}"

# Mantener solo los últimos 7 días localmente
find $BACKUP_DIR -type f -mtime +7 -delete

# (Opcional) Copiar a almacenamiento cloud seguro
# aws s3 cp ${BACKUP_DIR}/${FILE_NAME} s3://sitema-backups-satem/db/
```

### Configuración e Imágenes Docker

Las configuraciones del servidor (directorios `/nginx`, certificados Let's Encrypt y archivos `.env`) se respaldan semanalmente mediante un tarball comprimido.

---

## 3. Guía de Restauración Completa (Desastre Total)

En caso de pérdida total del servidor físico o la instancia Cloud:

### Paso 1: Reaprovisionar Infraestructura

1. Monte un nuevo servidor Linux Ubuntu 22.04 LTS.
2. Instale Docker y Docker Compose.
3. Descargue el repositorio Git del proyecto en la rama `main` (o tag de la release estable).

### Paso 2: Configurar Entorno

1. Copie el backup de las configuraciones y recupere el archivo `.env` correspondiente a producción.
2. Levante los contenedores limpios (sin base de datos con datos previos):
   ```bash
   docker compose up -d
   ```

### Paso 3: Restaurar Base de Datos

1. Obtenga el último respaldo `satem_prod_xxxx.sql.gz` del almacenamiento externo.
2. Descomprima el archivo:
   ```bash
   gunzip satem_prod_xxxx.sql.gz
   ```
3. Limpie la base de datos del contenedor recién creado e inyecte los datos históricos:
   ```bash
   # Limpiar tablas si existen (Prisma las recreará o psql dump tiene drop table)
   docker exec -i satem-food-engine-db psql -U satem_user -d satem_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

   # Restaurar datos
   docker exec -i satem-food-engine-db psql -U satem_user -d satem_db < satem_prod_xxxx.sql
   ```
4. Corra las migraciones de Prisma para asegurar compatibilidad de esquema con el código de la release activa:
   ```bash
   docker compose exec app npx prisma migrate deploy
   ```

---

## 4. Pruebas de Recuperación Periódicas

Para garantizar que los respaldos son válidos y legibles:

- Cada **30 días**, el administrador de TI debe descargar un backup aleatorio de producción.
- Debe restaurarlo en un contenedor local de desarrollo o Staging.
- Debe ejecutar `npm run test` o loguearse al KDS para verificar que no haya archivos corruptos.
