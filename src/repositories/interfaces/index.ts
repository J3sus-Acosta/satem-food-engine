/**
 * Repository interfaces barrel.
 *
 * These are pure TypeScript contracts (ports) for data access.
 * Import from here in services — never import the Prisma implementations
 * directly from `@/repositories/prisma/` in service code.
 */

export type { IProductRepository } from './IProductRepository'
export type { IOrderRepository } from './IOrderRepository'
export type { IPaymentRepository } from './IPaymentRepository'
export type { IKitchenRepository } from './IKitchenRepository'
export type { IInventoryRepository } from './IInventoryRepository'
export type { ICustomerRepository } from './ICustomerRepository'
export type { ICatalogRepository } from './ICatalogRepository'
export type { ITenantConfigurationRepository } from './ITenantConfigurationRepository'
export type { IProductCatalogRepository } from './IProductCatalogRepository'
export type { ICashRepository } from './ICashRepository'
