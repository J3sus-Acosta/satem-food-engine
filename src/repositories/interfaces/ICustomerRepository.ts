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
 * Repository contract for the Customer aggregate.
 *
 * Rules:
 * - Customer is SEPARATE from User (internal staff). No shared auth.
 * - Phone (E.164) is the primary cross-channel identifier within an org.
 * - Soft-deleted customers are excluded by default.
 */
export interface ICustomerRepository {
  /**
   * Find a customer by their unique identifier.
   * Returns null if not found or soft-deleted.
   */
  findById(id: string): Promise<Customer | null>

  /**
   * Find a customer with their loyalty account included.
   */
  findByIdWithLoyalty(id: string): Promise<CustomerWithLoyalty | null>

  /**
   * Find a customer by their E.164 phone number within an organization.
   * Returns null if not found.
   */
  findByPhone(organizationId: string, phone: string): Promise<Customer | null>

  /**
   * Find a customer by email within an organization.
   * Returns null if not found.
   */
  findByEmail(organizationId: string, email: string): Promise<Customer | null>

  /**
   * List all customers of an organization (active only).
   */
  findByOrganizationId(organizationId: string, options?: PaginationParams): Promise<Customer[]>

  /**
   * Count customers in an organization.
   */
  countByOrganizationId(organizationId: string): Promise<number>

  /**
   * Create a new customer and return the created entity.
   * Throws ConflictError if a customer with the same phone already exists.
   */
  create(data: CreateCustomerInput): Promise<Customer>

  /**
   * Update an existing customer and return the updated entity.
   * Throws NotFoundError if the customer does not exist.
   */
  update(id: string, data: UpdateCustomerInput): Promise<Customer>

  /**
   * Soft-delete a customer by setting deletedAt.
   */
  softDelete(id: string): Promise<void>

  // ── Loyalty ──────────────────────────────────────────────────────────────

  /**
   * Get the loyalty account for a customer in an organization.
   * Returns null if the customer has no loyalty account yet.
   */
  findLoyaltyAccount(customerId: string, organizationId: string): Promise<LoyaltyAccount | null>

  /**
   * Initialize a loyalty account for a customer.
   * Throws ConflictError if an account already exists.
   */
  createLoyaltyAccount(customerId: string, organizationId: string): Promise<LoyaltyAccount>

  /**
   * Add points to a customer's loyalty account and recalculate tier.
   */
  addPoints(
    customerId: string,
    organizationId: string,
    points: number,
    spentAmount: number
  ): Promise<LoyaltyAccount>

  /**
   * Deduct points from a customer's loyalty account.
   * Throws ConflictError if the customer has insufficient points.
   */
  deductPoints(customerId: string, organizationId: string, points: number): Promise<LoyaltyAccount>

  /**
   * Update the loyalty tier explicitly.
   */
  updateLoyaltyTier(
    customerId: string,
    organizationId: string,
    tier: LoyaltyTier
  ): Promise<LoyaltyAccount>
}
