/**
 * Prisma implementation of ICustomerRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { ICustomerRepository } from '@/repositories/interfaces'
import type {
  Customer,
  CustomerWithLoyalty,
  LoyaltyAccount,
  LoyaltyTier,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginationParams,
} from '@/types'

/**
 * Prisma-backed implementation of the Customer repository.
 *
 * Responsibilities:
 * - Enforce unique (organizationId, phone) via DB constraint + ConflictError.
 * - Map Prisma `Decimal` totalSpent to `Money` (number).
 * - LoyaltyAccount tier recalculation logic belongs in the service, not here.
 */
export class PrismaCustomerRepository implements ICustomerRepository {
  async findById(_id: string): Promise<Customer | null> {
    throw new NotImplementedError('PrismaCustomerRepository.findById')
  }

  async findByIdWithLoyalty(_id: string): Promise<CustomerWithLoyalty | null> {
    throw new NotImplementedError('PrismaCustomerRepository.findByIdWithLoyalty')
  }

  async findByPhone(_organizationId: string, _phone: string): Promise<Customer | null> {
    throw new NotImplementedError('PrismaCustomerRepository.findByPhone')
  }

  async findByEmail(_organizationId: string, _email: string): Promise<Customer | null> {
    throw new NotImplementedError('PrismaCustomerRepository.findByEmail')
  }

  async findByOrganizationId(
    _organizationId: string,
    _options?: PaginationParams
  ): Promise<Customer[]> {
    throw new NotImplementedError('PrismaCustomerRepository.findByOrganizationId')
  }

  async countByOrganizationId(_organizationId: string): Promise<number> {
    throw new NotImplementedError('PrismaCustomerRepository.countByOrganizationId')
  }

  async create(_data: CreateCustomerInput): Promise<Customer> {
    throw new NotImplementedError('PrismaCustomerRepository.create')
  }

  async update(_id: string, _data: UpdateCustomerInput): Promise<Customer> {
    throw new NotImplementedError('PrismaCustomerRepository.update')
  }

  async softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('PrismaCustomerRepository.softDelete')
  }

  async findLoyaltyAccount(
    _customerId: string,
    _organizationId: string
  ): Promise<LoyaltyAccount | null> {
    throw new NotImplementedError('PrismaCustomerRepository.findLoyaltyAccount')
  }

  async createLoyaltyAccount(
    _customerId: string,
    _organizationId: string
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('PrismaCustomerRepository.createLoyaltyAccount')
  }

  async addPoints(
    _customerId: string,
    _organizationId: string,
    _points: number,
    _spentAmount: number
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('PrismaCustomerRepository.addPoints')
  }

  async deductPoints(
    _customerId: string,
    _organizationId: string,
    _points: number
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('PrismaCustomerRepository.deductPoints')
  }

  async updateLoyaltyTier(
    _customerId: string,
    _organizationId: string,
    _tier: LoyaltyTier
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('PrismaCustomerRepository.updateLoyaltyTier')
  }
}
