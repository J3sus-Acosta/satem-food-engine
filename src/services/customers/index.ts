import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { ICustomerRepository } from '@/repositories'
import type {
  Customer,
  CustomerWithLoyalty,
  LoyaltyAccount,
  CreateCustomerInput,
  UpdateCustomerInput,
  Money,
} from '@/types'

/**
 * Service managing customer accounts, profiles, and loyalty points.
 *
 * Responsibilities:
 * - Customer identification and registration.
 * - Point accrual and redemption rules (e.g. 1 point per $100 spent).
 * - Loyalty tier transitions (Bronze, Silver, Gold, Platinum).
 */
export class CustomerService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  /**
   * Retrieves a customer profile along with their loyalty account.
   */
  async getCustomer(id: string): Promise<CustomerWithLoyalty> {
    throw new NotImplementedError('CustomerService.getCustomer')
  }

  /**
   * Finds an existing customer by phone, or creates a new one.
   * Format phone number to E.164.
   */
  async identifyCustomer(organizationId: string, phone: string, name?: string): Promise<Customer> {
    throw new NotImplementedError('CustomerService.identifyCustomer')
  }

  /**
   * Creates a new customer profile.
   */
  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    throw new NotImplementedError('CustomerService.createCustomer')
  }

  /**
   * Updates customer profile details.
   */
  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
    throw new NotImplementedError('CustomerService.updateCustomer')
  }

  /**
   * Processes loyalty points accrual based on purchase amount.
   */
  async accruePointsFromPurchase(
    customerId: string,
    organizationId: string,
    purchaseAmount: Money
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('CustomerService.accruePointsFromPurchase')
  }

  /**
   * Redeems loyalty points for a benefit or discount.
   */
  async redeemPoints(
    customerId: string,
    organizationId: string,
    points: number
  ): Promise<LoyaltyAccount> {
    throw new NotImplementedError('CustomerService.redeemPoints')
  }
}
