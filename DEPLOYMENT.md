# Guía de Despliegue — SATEM Food Engine

Esta guía documenta los pasos para realizar el despliegue del Release Candidate (RC1) de SATEM Food Engine en entornos de Staging y Producción utilizando Docker, Docker Compose y NGINX como Proxy Inverso con SSL.

---

## 1. Requisitos del Servidor

- **CPU / RAM**: Mínimo 1 vCPU, 1 GB de RAM (Recomendado 2 vCPUs, 2 GB RAM para compilar Next.js en servidor).
- **Sistema Operativo**: Linux Ubuntu 22.04 LTS o superior.
- **Plataformas**: Docker Engine v24+ y Docker Compose v2+.
- **Base de Datos**: Instancia PostgreSQL v15+ (Local o RDS/CloudDB).

---

## 2. Configuración de Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto basándote en [.env.example](file:///d:/Dev/satem-food-engine/.env.example).

### Variables Requeridas para Producción:

```ini
# Configuración del Entorno
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://menu.satem.cl

# Base de Datos (PostgreSQL)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/satem_db?schema=public"

# Seguridad y Webhooks de Sincronización (n8n)
# Generar una clave segura aleatoria de 32 caracteres
MENU_SYNC_SECRET="clave-segura-sincronizacion-sheets-n8n"

# Proveedores de Pago (Tenant Default)
PAYMENT_PROVIDER=sumup
SUMUP_WEBHOOK_SECRET="webhook-secret-provisto-por-sumup"

# Configuración del Tenant Default para MCI Santiago
NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG=mci-santiago
NEXT_PUBLIC_DEFAULT_LOCATION_SLUG=foodtruck-patio
```

---

## 3. Despliegue con Docker y Docker Compose

El repositorio incluye un archivo Dockerfile de múltiples etapas optimizado para producción.

### docker-compose.yml (Producción):

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: satem-food-engine-app
    restart: always
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - MENU_SYNC_SECRET=${MENU_SYNC_SECRET}
      - PAYMENT_PROVIDER=${PAYMENT_PROVIDER}
      - SUMUP_WEBHOOK_SECRET=${SUMUP_WEBHOOK_SECRET}
      - NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG=${NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG}
      - NEXT_PUBLIC_DEFAULT_LOCATION_SLUG=${NEXT_PUBLIC_DEFAULT_LOCATION_SLUG}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: satem-food-engine-db
    restart: always
    environment:
      POSTGRES_USER: satem_user
      POSTGRES_PASSWORD: password_seguro
      POSTGRES_DB: satem_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

### Ejecutar Despliegue:

```bash
# 1. Construir las imágenes y levantar contenedores en segundo plano
docker compose up --build -d

# 2. Verificar el estado de los contenedores
docker compose ps
```

---

## 4. Inicialización de Base de Datos y Prisma

Una vez que el contenedor de PostgreSQL esté activo, se deben correr las migraciones de Prisma para generar el esquema e inicializar los datos base.

```bash
# Ejecutar migraciones en el contenedor de la aplicación
docker compose exec app npx prisma migrate deploy

# (Opcional) Correr seeds para datos iniciales de MCI Santiago si el script está configurado
docker compose exec app npx prisma db seed
```

---

## 5. Configuración de NGINX y Certificado SSL (HTTPS)

Para exponer el servicio de manera segura a los clientes de MCI Santiago, configuraremos NGINX como proxy inverso.

### Configuración del Bloque de Servidor `/etc/nginx/sites-available/satem`:

```nginx
server {
    listen 80;
    server_name menu.satem.cl;

    # Redirección automática a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name menu.satem.cl;

    ssl_certificate /etc/letsencrypt/live/menu.satem.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menu.satem.cl/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Endpoint de Health Check
    location /api/health {
        proxy_pass http://localhost:3000/api/health; # Configura una ruta de health check simple
        access_log off;
    }
}
```

Habilitar el sitio y reiniciar NGINX:

```bash
ln -s /etc/nginx/sites-available/satem /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Para generar los certificados SSL Let's Encrypt de forma gratuita:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d menu.satem.cl
```

---

## 6. Respaldos Preventivos (Antes del despliegue en actualizaciones)

Antes de actualizar a una nueva release, respalde la base de datos de producción:

```bash
docker exec -t satem-food-engine-db pg_dump -U satem_user satem_db > backup_satem_$(date +%F_%H%M%S).sql
```

---

## 7. Plan de Rollback (Retorno Seguro)

Si la nueva versión RC1 presenta errores graves en producción, siga estos pasos para retornar al estado previo:

1. **Parar la versión actual**:
   ```bash
   docker compose down
   ```
2. **Restaurar base de datos al backup previo**:
   ```bash
   docker exec -i satem-food-engine-db psql -U satem_user -d satem_db < backup_satem_anterior.sql
   ```
3. **Revertir la imagen Docker en Git y redesplegar**:
   ```bash
   git checkout tags/v_anterior
   docker compose up -d --build
   ```

---

## 8. Checklist de Despliegue (Release Day)

- [ ] Backup de base de datos de producción completado.
- [ ] Variables de entorno `.env` verificadas (en especial `MENU_SYNC_SECRET`).
- [ ] Puertos del firewall configurados (80, 443 abiertos; 5432 cerrado a la red externa).
- [ ] Ejecución de `prisma migrate deploy` exitosa sin pérdida de datos.
- [ ] Certificado SSL vigente y redirección HTTPS activa.
- [ ] Ejecución exitosa de workflows de n8n verificada.
