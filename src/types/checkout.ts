export interface CreateCustomerOrderInput {
  locationId: string

  customerName?: string
  customerPhone?: string

  items: Array<{
    menuItemId: string
    quantity: number

    modifiers?: Array<{
      modifierId: string
    }>

    notes?: string
  }>
}
