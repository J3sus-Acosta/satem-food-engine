import type { DailyMenuRowInput } from '@/types'

export interface ClientItemState {
  menuItemId: string
  code: string // SKU
  isAvailable: boolean
  isVisible: boolean
  isHighlighted: boolean
  price: string // string to allow clean editing (backspaces) in text inputs
  stockDaily: string
  sortOrder: string
  notes: string
}

/**
 * Transforms client-side editable states (keyed by menuItemId)
 * into the canonical DailyMenuRowInput[] format expected by the API endpoints.
 *
 * Separation of Concerns: Keeps UI presentation logic clean and isolated
 * from API data-contract requirements.
 */
export function transformToDailyMenuRows(states: ClientItemState[]): DailyMenuRowInput[] {
  return states.map((state) => {
    // Parse numeric fields safely. Empty strings map to null (meaning "no override / use master price")
    const precioVal = state.price.trim() === '' ? null : Number(state.price)
    const stockVal = state.stockDaily.trim() === '' ? null : Number(state.stockDaily)
    const ordenVal = state.sortOrder.trim() === '' ? null : Number(state.sortOrder)

    return {
      Código: state.code,
      Disponible: state.isAvailable ? 'SI' : 'NO',
      Visible: state.isVisible ? 'SI' : 'NO',
      Precio: precioVal !== null && !isNaN(precioVal) ? precioVal : null,
      Stock: stockVal !== null && !isNaN(stockVal) ? Math.floor(stockVal) : null,
      Destacado: state.isHighlighted ? 'SI' : 'NO',
      Orden: ordenVal !== null && !isNaN(ordenVal) ? Math.floor(ordenVal) : null,
      Nota: state.notes.trim() === '' ? null : state.notes.trim(),
    }
  })
}
