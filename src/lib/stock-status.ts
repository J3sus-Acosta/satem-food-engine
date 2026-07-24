export type StockVisualStatus = 'NORMAL' | 'LOW' | 'CRITICAL'

/**
 * Determinante del estado visual del stock de un producto para el POS.
 *
 * Reglas de negocio visual:
 * - Stock >= 15 (o null / undefined para sin límite): Estado NORMAL
 * - Stock entre 4 y 14 (inclusive): Estado BAJO (< 15)
 * - Stock menor a 4 (0 a 3 unidades): Estado CRÍTICO (< 4)
 *
 * @param stock - Cantidad de stock disponible o null/undefined si no hay límite
 * @returns Estado visual ('NORMAL' | 'LOW' | 'CRITICAL')
 */
export function getStockVisualStatus(stock: number | null | undefined): StockVisualStatus {
  if (stock === null || stock === undefined || stock >= 15) {
    return 'NORMAL'
  }
  if (stock < 4) {
    return 'CRITICAL'
  }
  return 'LOW'
}

/**
 * Retorna las clases de Tailwind correspondientes al fondo de la tarjeta del POS
 * según el estado visual del stock.
 *
 * - NORMAL: bg-card (Fondo por defecto del Design System)
 * - LOW: Amarillo translúcido (bg-amber-200/60 dark:bg-amber-950/50)
 * - CRITICAL: Rojo translúcido (bg-red-200/60 dark:bg-red-950/50)
 *
 * @param stock - Cantidad de stock disponible o null/undefined si no hay límite
 * @returns Cadena de clases CSS de Tailwind
 */
export function getStockCardBgClass(stock: number | null | undefined): string {
  const status = getStockVisualStatus(stock)
  switch (status) {
    case 'LOW':
      return 'bg-amber-200/60 dark:bg-amber-950/50'
    case 'CRITICAL':
      return 'bg-red-200/60 dark:bg-red-950/50'
    case 'NORMAL':
    default:
      return 'bg-card'
  }
}
