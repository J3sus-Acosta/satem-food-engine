import type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  ConfirmPaymentInput,
} from '@/types'

/**
 * Repository contract for the Payment aggregate.
 *
 * Rules:
 * - Payments are never soft-deleted. Status transitions are the audit trail.
 * - One active payment per order at a time (enforced by DB unique constraint).
 * - The repository does NOT call external payment providers — that is the
 *   responsibility of the PaymentService + SumUp/Stripe integrations.
 */
export interface IPaymentRepository {
  /**
   * Find a payment by its unique identifier.
   * Returns null if not found.
   */
  findById(id: string): Promise<Payment | null>

  /**
   * Find the payment associated with a given order.
   * Returns null if no payment has been initiated yet.
   */
  findByOrderId(orderId: string): Promise<Payment | null>

  /**
   * Find a payment by its external provider transaction ID.
   * Used for webhook verification and idempotency checks.
   */
  findByExternalId(provider: PaymentProvider, externalId: string): Promise<Payment | null>

  /**
   * Create a new payment record in PENDING status.
   * Throws ConflictError if an active payment already exists for the order.
   */
  create(data: CreatePaymentInput): Promise<Payment>

  /**
   * Mark a payment as PAID after receiving confirmation from the provider.
   */
  confirm(id: string, data: ConfirmPaymentInput): Promise<Payment>

  /**
   * Atomically transitions a payment from PENDING → PAID only if it is still PENDING.
   *
   * Uses an atomic `updateMany` with a WHERE status='PENDING' condition so that
   * concurrent webhook deliveries cannot both confirm the same payment. If the
   * payment has already been confirmed (or failed), the operation is a no-op.
   *
   * @returns `{ confirmed: true, payment }` if the transition occurred.
   *          `{ confirmed: false, payment }` if the payment was already in a terminal state.
   */
  confirmIfPending(
    id: string,
    data: ConfirmPaymentInput
  ): Promise<{ confirmed: boolean; payment: Payment }>

  /**
   * Mark a payment as FAILED with an optional reason.
   */
  markFailed(id: string, reason: string): Promise<Payment>

  /**
   * Mark a payment as REFUNDED.
   */
  markRefunded(id: string): Promise<Payment>

  /**
   * Update the external provider transaction ID and optional metadata.
   */
  updateExternalId(
    id: string,
    externalId: string,
    metadata?: Record<string, unknown>
  ): Promise<Payment>

  /**
   * Update the payment status to any valid value.
   * Prefer the specific methods above over this generic one.
   */
  updateStatus(id: string, status: PaymentStatus): Promise<Payment>
}
