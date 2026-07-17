# Guía de Importación y Configuración — Workflows n8n

Esta guía describe el procedimiento paso a paso para desplegar y configurar los workflows de automatización de SATEM Food Engine en una instancia nueva o limpia de n8n.

---

## 1. Configuración de Credenciales

Antes de activar los workflows, configure las siguientes credenciales dentro del panel de configuración de n8n (`Credentials` -> `Add Credential`):

1. **Google Sheets / Drive API (OAuth2 o Service Account):**
   - Requerido para: Leer los datos maestros de stock y menú.
   - Configuración: Cree una cuenta de servicio en Google Cloud Console, descargue el JSON de credenciales y péguelo en n8n, o active OAuth2 con los scopes de lectura de Sheets.
2. **SumUp API Credentials (OAuth2 o Custom Header Token):**
   - Requerido para: Validar la firma de los webhooks y consultar estados de transacciones en la API de SumUp.
3. **SMTP Credentials (Email):**
   - Requerido para: Despachar reportes nocturnos de cierre y alertas de stock crítico al administrador.
   - Configuración: Use un servidor como SendGrid, Mailgun o su cuenta SMTP de Gmail.

---

## 2. Variables y Secretos Necesarios

Configure las siguientes variables en el entorno donde corre n8n o dentro del archivo `.env` del contenedor de n8n. Estas son utilizadas de forma dinámica por los nodos HTTP Request:

| Variable               | Descripción                                                                          | Ejemplo / Formato                        | Obligatoria               |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_APP_URL`  | URL base pública de la aplicación Next.js de SATEM Food Engine.                      | `https://satem.foodengine.cl`            | **Sí**                    |
| `MENU_SYNC_SECRET`     | Token secreto de seguridad para autorizar la sincronización del menú diario.         | `satem_menu_sync_super_secret_token`     | **Sí**                    |
| `SUMUP_API_KEY`        | Clave privada de API para autenticarse contra SumUp.                                 | `sup_live_abcdef123456...`               | **Sí** (en producción)    |
| `SUMUP_WEBHOOK_SECRET` | Secreto compartido provisto por SumUp para verificar la firma de webhooks entrantes. | `webhook_sec_xyz789...`                  | **Sí** (en producción)    |
| `WEBPAY_COMMERCE_CODE` | Código de comercio oficial provisto por Transbank para Webpay.                       | `597012345678`                           | **Sí** (en producción)    |
| `WEBPAY_API_KEY`       | Llave secreta del comercio provista por Transbank.                                   | `tsb_sec_key_xyz...`                     | **Sí** (en producción)    |
| `DATABASE_URL`         | Conexión de base de datos PostgreSQL principal de SATEM.                             | `postgresql://user:pass@host:5432/satem` | **Sí** (backend de SATEM) |

---

## 3. Orden de Importación Recomendado

Para evitar errores de dependencias de rutas y webhooks, importe los workflows en el siguiente orden:

1. **Workflow 01 — Menu Sync:**
   - Ubicación: [`workflows/01-menu-sync.json`](workflows/01-menu-sync.json)
   - Nota: Reemplace el valor del nodo `Fetch Google Sheets Menu` con la URL de su documento de Google Sheets publicado como CSV.
2. **Workflow 02 — Payment Webhooks:**
   - Ubicación: [`workflows/02-payment-webhooks.json`](workflows/02-payment-webhooks.json)
   - Nota: Copie la URL del webhook de producción generado por n8n en el nodo `SumUp Payment Webhook` y configúrelo en su panel de SumUp.
3. **Workflow 03 — Order Status:**
   - Ubicación: [`workflows/03-order-status.json`](workflows/03-order-status.json)
   - Nota: Copie la URL del webhook generado y configúrela en la variable `ORDER_STATUS_WEBHOOK_URL` en el entorno de SATEM.
4. **Workflow 04 — Nightly Maintenance:**
   - Ubicación: [`workflows/04-nightly-maintenance.json`](workflows/04-nightly-maintenance.json)
5. **Workflow 05 — Low Stock Alert:**
   - Ubicación: [`workflows/05-low-stock-alert.json`](workflows/05-low-stock-alert.json)

---

## 4. Activación y Pruebas

1. **Cómo importar:**
   - En n8n, haga clic en `Workflows` -> `New workflow`.
   - En las opciones superiores derechas, seleccione `Import from file` y elija el archivo JSON correspondiente.
2. **Activación:**
   - Cambie el switch de `Active` de cada workflow en la esquina superior derecha a **ON**. Esto activará los triggers de Cron Schedule y expondrá las URL públicas de los Webhooks.
3. **Ejecución de Pruebas:**
   - Presione `Test step` o `Listen for test event` en los triggers correspondientes.
   - Envíe peticiones POST simuladas utilizando `curl` o herramientas como Postman a los endpoints de webhooks correspondientes para validar la respuesta `200 OK`.
