import type { OrderType } from './index'

export interface CreateCustomerOrderInput {
  locationId: string

  customerName?: string
  customerPhone?: string
  type?: OrderType

  items: Array<{
    menuItemId: string
    quantity: number

    modifiers?: Array<{
      modifierId: string
    }>

    notes?: string
  }>
}
