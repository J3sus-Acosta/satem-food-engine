/**
 * Services module entry point.
 * Exports all pure domain services.
 */

export { ProductService, productService } from './products'
export { OrderService, orderService, OrderVoidService, orderVoidService } from './orders'
export { PaymentService, paymentService } from './payments'
export { KitchenService, kitchenService } from './kitchen'
export { InventoryService } from './inventory'
export { CustomerService } from './customers'
export { ChatService } from './chat'
export { ProductCatalogService, productCatalogService } from './catalog'
export { CashService, cashService, ReportingService, reportingService } from './cash'
export type { ReportFilters, ReportResult, CashMovementReport } from './cash'
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
  AuthenticateUserService,
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
export const authenticateUserService = new AuthenticateUserService(userRepo)

export {
  CreateUserService,
  UpdateUserService,
  ChangePasswordService,
  EnableUserService,
  DisableUserService,
  DeleteUserService,
  FindUserService,
  ListUsersService,
  AuthenticateUserService,
} from './users'

// Discount & Credit Services
import { PrismaDiscountCreditRepository } from '@/repositories/prisma/PrismaDiscountCreditRepository'
import {
  CreateDiscountCreditService,
  UpdateDiscountCreditService,
  EnableDiscountCreditService,
  DisableDiscountCreditService,
  FindDiscountCreditService,
  ListDiscountCreditsService,
  CalculateDiscountCreditService,
  DuplicateDiscountCreditService,
  DeleteDiscountCreditService,
} from './discounts'

const discountCreditRepo = new PrismaDiscountCreditRepository()

export const createDiscountCreditService = new CreateDiscountCreditService(discountCreditRepo)
export const updateDiscountCreditService = new UpdateDiscountCreditService(discountCreditRepo)
export const enableDiscountCreditService = new EnableDiscountCreditService(discountCreditRepo)
export const disableDiscountCreditService = new DisableDiscountCreditService(discountCreditRepo)
export const findDiscountCreditService = new FindDiscountCreditService(discountCreditRepo)
export const listDiscountCreditsService = new ListDiscountCreditsService(discountCreditRepo)
export const calculateDiscountCreditService = new CalculateDiscountCreditService(discountCreditRepo)
export const duplicateDiscountCreditService = new DuplicateDiscountCreditService(discountCreditRepo)
export const deleteDiscountCreditService = new DeleteDiscountCreditService(discountCreditRepo)

export {
  CreateDiscountCreditService,
  UpdateDiscountCreditService,
  EnableDiscountCreditService,
  DisableDiscountCreditService,
  FindDiscountCreditService,
  ListDiscountCreditsService,
  CalculateDiscountCreditService,
  DuplicateDiscountCreditService,
  DeleteDiscountCreditService,
} from './discounts'

// Custom Reporting Services (Fase 17)
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { PrismaReportTemplateRepository } from '@/repositories/prisma/PrismaReportTemplateRepository'
import { CustomReportService } from './reports/CustomReportService'

const customReportOrderRepo = new PrismaOrderRepository()
const customReportTemplateRepo = new PrismaReportTemplateRepository()

export const customReportService = new CustomReportService(
  customReportOrderRepo,
  customReportTemplateRepo
)

export {
  CustomReportService,
  COLUMN_LABELS,
  DEFAULT_VISIBLE_COLUMNS,
} from './reports/CustomReportService'
