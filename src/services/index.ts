/**
 * Services module entry point.
 * Exports all pure domain services.
 */

export { ProductService, productService } from './products'
export { OrderService, orderService } from './orders'
export { PaymentService, paymentService } from './payments'
export { KitchenService, kitchenService } from './kitchen'
export { InventoryService } from './inventory'
export { CustomerService } from './customers'
export { ChatService } from './chat'
export {
  validateSheetRows,
  adaptSheetRowsToDomain,
  formatSheetErrors,
  validateMenuSyncSecret,
} from './menu-sync'
export type { SheetRow, SheetRowValidationError, SheetValidationResult } from './menu-sync'
