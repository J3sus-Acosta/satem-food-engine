/**
 * Prisma implementation of IPaymentRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

// import { db } from '@/server/db'  // Uncomment when implementing methods
import { NotImplementedError } from '@/lib/errors'
import type { IPaymentRepository } from '@/repositories/interfaces'
import type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  ConfirmPaymentInput,
} from '@/types'

/**
 * Prisma-backed implementation of the Payment repository.
 *
 * Responsibilities:
 * - Map Prisma `Decimal` to `Money` (number).
 * - The DB unique constraint on (orderId) enforces one active payment per order.
 */
export class PrismaPaymentRepository implements IPaymentRepository {
  async findById(_id: string): Promise<Payment | null> {
    throw new NotImplementedError('PrismaPaymentRepository.findById')
  }

  async findByOrderId(_orderId: string): Promise<Payment | null> {
    throw new NotImplementedError('PrismaPaymentRepository.findByOrderId')
  }

  async findByExternalId(_provider: PaymentProvider, _externalId: string): Promise<Payment | null> {
    throw new NotImplementedError('PrismaPaymentRepository.findByExternalId')
  }

  async create(_data: CreatePaymentInput): Promise<Payment> {
    throw new NotImplementedError('PrismaPaymentRepository.create')
  }

  async confirm(_id: string, _data: ConfirmPaymentInput): Promise<Payment> {
    throw new NotImplementedError('PrismaPaymentRepository.confirm')
  }

  async markFailed(_id: string, _reason: string): Promise<Payment> {
    throw new NotImplementedError('PrismaPaymentRepository.markFailed')
  }

  async markRefunded(_id: string): Promise<Payment> {
    throw new NotImplementedError('PrismaPaymentRepository.markRefunded')
  }

  async updateStatus(_id: string, _status: PaymentStatus): Promise<Payment> {
    throw new NotImplementedError('PrismaPaymentRepository.updateStatus')
  }
}
