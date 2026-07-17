# Variables de Entorno — SATEM Food Engine

Este documento describe todas las variables de entorno utilizadas por **SATEM Food Engine**, su propósito, los valores sugeridos y los entornos donde son obligatorias.

---

## 1. Persistencia y Base de Datos

### `DATABASE_URL`

- **Propósito:** Cadena de conexión para acceder a la base de datos PostgreSQL mediante Prisma ORM.
- **Formato:** `postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE_DE_DATOS?schema=public`
- **Requerido en:** Todos los entornos (Desarrollo, Staging y Producción).
- **Ejemplo:** `postgresql://satem_user:secure_pwd@localhost:5432/satem_db?schema=public`

---

## 2. Configuración de Pasarela de Pagos

### `PAYMENT_PROVIDER`

- **Propósito:** Define la pasarela de pagos activa a nivel global para fallbacks del servidor y configuraciones globales.
- **Valores soportados:** `SUMUP` (por defecto) o `WEBPAY` (esqueleto del proveedor Webpay).
- **Requerido en:** Todos los entornos.
- **Ejemplo:** `PAYMENT_PROVIDER="SUMUP"`

### `SUMUP_API_KEY`

- **Propósito:** Clave de API de SumUp utilizada para autenticar peticiones de creación de intenciones de pago, cobros y devoluciones.
- **Requerido en:** Producción y Staging (en desarrollo local se simula con mocks de API si no está configurada).
- **Ejemplo:** `SUMUP_API_KEY="sup_sk_xxxxxxxxxxxxxxxxxxxx"`

### `SUMUP_WEBHOOK_SECRET`

- **Propósito:** Clave secreta compartida utilizada para validar criptográficamente la firma de los webhooks entrantes de SumUp.
- **Requerido en:** Producción y Staging (en desarrollo se ignora o se simula con firmas de prueba).
- **Ejemplo:** `SUMUP_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"`

---

## 3. Webhooks de Sincronización y Automatización

### `MENU_SYNC_SECRET`

- **Propósito:** Token compartido entre el orquestador externo (**n8n**) y la aplicación Next.js para securizar la sincronización del menú diario vía Google Sheets.
- **Header esperado:** `x-menu-sync-secret`
- **Requerido en:** Producción (en desarrollo local se puede dejar vacío para facilitar la depuración).
- **Ejemplo:** `MENU_SYNC_SECRET="a8f0923cd82390f772ab11b22cc5938d"`

---

## 4. Variables Públicas de Cliente (Next.js)

Estas variables comienzan con el prefijo `NEXT_PUBLIC_` y se inyectan en el bundle del cliente. **Nunca** deben contener secretos o contraseñas.

### `NEXT_PUBLIC_APP_URL`

- **Propósito:** URL pública base de la aplicación (sin barra inclinada al final). Utilizada para calcular redirecciones absolutas y enlaces de pagos.
- **Requerido en:** Todos los entornos.
- **Ejemplo:** `NEXT_PUBLIC_APP_URL="https://patio-mci.satem.cl"`

### `NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG`

- **Propósito:** Slug identificador por defecto de la organización para vistas públicas directas del catálogo.
- **Requerido en:** Desarrollo y entornos unificados.
- **Ejemplo:** `NEXT_PUBLIC_DEFAULT_ORGANIZATION_SLUG="mci-santiago"`

### `NEXT_PUBLIC_DEFAULT_LOCATION_SLUG`

- **Propósito:** Slug identificador por defecto del local (sucursal) para vistas públicas directas del catálogo.
- **Requerido en:** Desarrollo y entornos unificados.
- **Ejemplo:** `NEXT_PUBLIC_DEFAULT_LOCATION_SLUG="foodtruck-patio"`
