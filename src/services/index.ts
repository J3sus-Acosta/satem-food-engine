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
export { ProductCatalogService, productCatalogService } from './catalog'
export { CashService, cashService, ReportingService, reportingService } from './cash'
export type { ReportFilters, ReportResult } from './cash'
export {
  validateSheetRows,
  adaptSheetRowsToDomain,
  formatSheetErrors,
  validateMenuSyncSecret,
} from './menu-sync'
export type { SheetRow, SheetRowValidationError, SheetValidationResult } from './menu-sync'

// User Management Services
import { PrismaUserRepository } from '@/repositories/prisma/PrismaUserRepository'
import {
  CreateUserService,
  UpdateUserService,
  ChangePasswordService,
  EnableUserService,
  DisableUserService,
  DeleteUserService,
  FindUserService,
  ListUsersService,
} from './users'

const userRepo = new PrismaUserRepository()

export const createUserService = new CreateUserService(userRepo)
export const updateUserService = new UpdateUserService(userRepo)
export const changePasswordService = new ChangePasswordService(userRepo)
export const enableUserService = new EnableUserService(userRepo)
export const disableUserService = new DisableUserService(userRepo)
export const deleteUserService = new DeleteUserService(userRepo)
export const findUserService = new FindUserService(userRepo)
export const listUsersService = new ListUsersService(userRepo)

export {
  CreateUserService,
  UpdateUserService,
  ChangePasswordService,
  EnableUserService,
  DisableUserService,
  DeleteUserService,
  FindUserService,
  ListUsersService,
} from './users'
