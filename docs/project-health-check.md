# Reporte de Auditoría Arquitectónica — SATEM Food Engine

Este documento registra los resultados de la auditoría técnica realizada sobre el repositorio **satem-food-engine**, verificando el cumplimiento de las directrices de **Clean Architecture**, la separación de responsabilidades y la preparación técnica para producción.

---

## 1. Estado Actual

El proyecto cuenta con un backend maduro estructurado en base al patrón de **puertos y adaptadores (Clean Architecture)**. La separación por capas se respeta adecuadamente en todo el árbol de directorios:

- **Capa de Entrada (HTTP):** Ubicada en `src/app/api/`. Los Route Handlers son delgados; su función principal es parsear la solicitud, ejecutar validaciones de formato básico de datos y mapear los resultados y excepciones a respuestas HTTP tipadas (`NextResponse<ApiResponse<T>>`).
- **Capa de Dominio y Lógica (Services):** Ubicada en `src/services/`. Contiene clases autocontenidas de negocio (como `OrderService` o `ProductService`) que se comunican exclusivamente con los repositorios a través de interfaces TypeScript (`src/repositories/interfaces/`), garantizando el desacoplamiento de la tecnología de persistencia.
- **Capa de Adaptadores de Persistencia (Repositories):** Ubicada en `src/repositories/prisma/`. Implementa el acceso y mutación de datos utilizando Prisma y PostgreSQL.
- **Capa de Integración Externa:** Ubicada en `src/integrations/`. Contiene adaptadores para proveedores de pagos (`SumUp`, `Webpay`), n8n, mensajería y servicios externos.
- **Capa de Presentación (UI):** Ubicada en `src/components/` y `src/app/`. Los componentes clientes no contienen llamadas a Prisma ni lógica de persistencia directa; interactúan exclusivamente con la capa backend a través de llamadas API HTTP locales.

---

## 2. Cumplimiento de Reglas de Arquitectura (`AGENTS.md`)

| Regla de Arquitectura                                      | Estado          | Detalle técnico                                                                                                                                                                            |
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ningún servicio del dominio accede a Prisma directamente   | **CUMPLIDO** ✅ | Ningún archivo de `src/services` importa `@/server/db` ni interactúa directamente con el cliente Prisma. Todo se realiza a través de interfaces de repositorio inyectadas por constructor. |
| Persistencia únicamente mediante Interfaces de Repositorio | **CUMPLIDO** ✅ | `ICatalogRepository`, `IOrderRepository`, `IPaymentRepository`, etc., definen todos los contratos de persistencia.                                                                         |
| Integraciones externas aisladas                            | **CUMPLIDO** ✅ | Proveedores como `SumUpPaymentProvider` implementan la interfaz `IPaymentProvider` dentro de `src/integrations/payments/`.                                                                 |
| Route Handlers delgados                                    | **CUMPLIDO** ✅ | Se limitan a llamadas `try/catch` delegando el procesamiento real a los servicios de dominio correspondientes.                                                                             |
| Componentes React sin lógica de persistencia               | **CUMPLIDO** ✅ | Se comunican vía Fetch HTTP nativo con la API local.                                                                                                                                       |

---

## 3. Riesgos Arquitectónicos y Técnicos Detectados

Durante la revisión se identificaron los siguientes aspectos que merecen atención preventiva antes de pasar a producción:

1. **Ausencia de Pruebas Automatizadas en Servicios Core:**
   - La lógica de cambios en el stock diario de productos, cálculo de precios por overrides y transiciones de estado de pedidos dependía únicamente de verificaciones manuales. La introducción de cambios podría causar regresiones silenciosas.
2. **Exposición de Bypasses de Seguridad en Producción (SumUp/Webhook Sync):**
   - El mock para validación de firmas de webhooks de SumUp permitía validar payloads arbitrarios si la variable `SUMUP_WEBHOOK_SECRET` estaba ausente o si se enviaba el header `x-mock-signature: true`. Esto representa un riesgo si el entorno no se configura estrictamente.
3. **Falta de Validación Estricta de Claves de Sincronización en Producción:**
   - En entornos locales es cómodo permitir la sincronización sin configurar secretos, pero en producción, la ausencia accidental de la variable `MENU_SYNC_SECRET` expondría el endpoint `/api/webhooks/menu-sync` de forma pública.

---

## 4. Recomendaciones Priorizadas

### 🔴 Crítico

- **Reforzar validación de firmas en webhooks (SumUp):** Bloquear el bypass de `x-mock-signature` y la validación por omisión cuando `NODE_ENV === 'production'`.
- **Prevenir sincronización sin secret en producción (Google Sheets):** Forzar a que la validación retorne `false` en producción si no existe un secreto configurado.

### 🟡 Importante

- **Instalar Vitest y Suite de Testing:** Establecer las pruebas unitarias automatizadas con mocks para evitar regresiones de desarrollo en la lógica de cobros, transiciones de pedidos y validaciones de payloads.
- **Auditoría y documentación de variables de entorno:** Documentar y unificar las variables necesarias para producción para evitar omisiones de configuración al desplegar.

### 🟢 Futuro

- **Implementar firma HMAC real para SumUp:** Cuando se complete la fase de pruebas reales con la API oficial de SumUp, pasar de la firma de simulación al cómputo HMAC SHA256 usando `crypto.timingSafeEqual`.
