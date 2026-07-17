---
name: tablet-ui
description: Convenciones para el diseño de interfaces táctiles.
---

# Tablet UI (Pantallas Táctiles)

## Propósito

Asegurar que los módulos operativos (Kitchen Dashboard, POS, Recepción) estén optimizados ergonómica y visualmente para dispositivos iPad o Tablets instalados en entornos acelerados como una cocina comercial.

## Cuándo debe cargarse automáticamente

- Al crear componentes visuales en los grupos de rutas `src/app/(dashboard)/kitchen/` o `src/app/(dashboard)/orders/`.

## Convenciones (Extraídas del Kitchen Dashboard)

- **Kanban Flow:** La gestión operativa fluye de izquierda a derecha en columnas verticales scrollables.
- **Micro-Interacciones Táctiles:** El estándar para botones principales (ej. "Comenzar Preparación") es asegurar una "hit-box" (zona de toque) amplia, evitando padding o márgenes muy estrechos. No depender del estado `hover` para información crítica (ej. `tooltips`), ya que no existe un cursor en el iPad.
- **Tipografía y Contraste:** Uso de fuentes más grandes para identificadores críticos. Ejemplo: el `#orderNumber` debe destacar significativamente para lecturas rápidas a un metro de distancia de la pantalla.

## Referencias

- Para componentes de UI generales, referirse a `ui-components`.
- Ejemplo vivo: `src/app/dashboard/kitchen/page.tsx`
