/**
 * Prisma implementation of IPaymentRepository.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 */
import 'server-only'

import { db } from '@/server/db'
import { Prisma } from '@/generated/prisma'
import type { Payment as PrismaPayment } from '@/generated/prisma'
import { isConnectionError } from './shared'
import type { IPaymentRepository } from '@/repositories/interfaces'
import type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  CreatePaymentInput,
  ConfirmPaymentInput,
} from '@/types'

// In-Memory state for local development when PostgreSQL is not running
const IN_MEMORY_PAYMENTS: Payment[] = []
let IN_MEMORY_COUNTER = 0

function mapPrismaPaymentToDomain(payment: PrismaPayment): Payment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider as PaymentProvider,
    status: payment.status as PaymentStatus,
    amount: Number(payment.amount),
    currency: payment.currency,
    externalId: payment.externalId,
    externalReference: payment.externalReference,
    paidAt: payment.paidAt,
    failureReason: payment.failureReason,
    receiptUrl: payment.receiptUrl,
    metadata: payment.metadata as unknown as Record<string, unknown> | null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

export class PrismaPaymentRepository implements IPaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    try {
      const payment = await db.payment.findFirst({
        where: { id },
      })
      return payment ? mapPrismaPaymentToDomain(payment) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.findById] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        return found || null
      }
      throw error
    }
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    try {
      const payment = await db.payment.findFirst({
        where: { orderId },
      })
      return payment ? mapPrismaPaymentToDomain(payment) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.findByOrderId] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.orderId === orderId)
        return found || null
      }
      throw error
    }
  }

  async findByExternalId(provider: PaymentProvider, externalId: string): Promise<Payment | null> {
    try {
      const payment = await db.payment.findFirst({
        where: { provider, externalId },
      })
      return payment ? mapPrismaPaymentToDomain(payment) : null
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.findByExternalId] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find(
          (p) => p.provider === provider && p.externalId === externalId
        )
        return found || null
      }
      throw error
    }
  }

  async create(data: CreatePaymentInput): Promise<Payment> {
    try {
      const payment = await db.payment.create({
        data: {
          orderId: data.orderId,
          provider: data.provider,
          amount: data.amount,
          currency: data.currency,
          status: 'PENDING',
        },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.create] DB connection failed, using in-memory store.'
        )
        const newPayment: Payment = {
          id: `mem_pay_${++IN_MEMORY_COUNTER}`,
          orderId: data.orderId,
          provider: data.provider,
          status: 'PENDING',
          amount: data.amount,
          currency: data.currency,
          externalId: null,
          externalReference: null,
          paidAt: null,
          failureReason: null,
          receiptUrl: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        IN_MEMORY_PAYMENTS.push(newPayment)
        return newPayment
      }
      throw error
    }
  }

  async confirm(id: string, data: ConfirmPaymentInput): Promise<Payment> {
    try {
      const payment = await db.payment.update({
        where: { id },
        data: {
          status: 'PAID',
          externalId: data.externalId,
          externalReference: data.externalReference || null,
          receiptUrl: data.receiptUrl || null,
          paidAt: data.paidAt,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.confirm] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        found.status = 'PAID'
        found.externalId = data.externalId
        found.externalReference = data.externalReference || null
        found.receiptUrl = data.receiptUrl || null
        found.paidAt = data.paidAt
        found.metadata = data.metadata || {}
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async confirmIfPending(
    id: string,
    data: ConfirmPaymentInput
  ): Promise<{ confirmed: boolean; payment: Payment }> {
    try {
      const result = await db.payment.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'PAID',
          externalId: data.externalId,
          externalReference: data.externalReference || null,
          receiptUrl: data.receiptUrl || null,
          paidAt: data.paidAt,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
      })

      const paymentRecord = await db.payment.findUnique({
        where: { id },
      })

      if (!paymentRecord) {
        throw new Error(`Payment ${id} not found after atomic update`)
      }

      const payment = mapPrismaPaymentToDomain(paymentRecord)
      return {
        confirmed: result.count > 0,
        payment,
      }
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.confirmIfPending] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        if (found.status === 'PENDING') {
          found.status = 'PAID'
          found.externalId = data.externalId
          found.externalReference = data.externalReference || null
          found.receiptUrl = data.receiptUrl || null
          found.paidAt = data.paidAt
          found.metadata = data.metadata || {}
          found.updatedAt = new Date()

          return { confirmed: true, payment: found }
        }

        return { confirmed: false, payment: found }
      }
      throw error
    }
  }

  async markFailed(id: string, reason: string): Promise<Payment> {
    try {
      const payment = await db.payment.update({
        where: { id },
        data: {
          status: 'FAILED',
          failureReason: reason,
        },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.markFailed] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        found.status = 'FAILED'
        found.failureReason = reason
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async markRefunded(id: string): Promise<Payment> {
    try {
      const payment = await db.payment.update({
        where: { id },
        data: {
          status: 'REFUNDED',
        },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.markRefunded] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        found.status = 'REFUNDED'
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async updateExternalId(
    id: string,
    externalId: string,
    metadata?: Record<string, unknown>
  ): Promise<Payment> {
    try {
      const payment = await db.payment.update({
        where: { id },
        data: {
          externalId,
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.updateExternalId] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        found.externalId = externalId
        found.metadata = metadata || {}
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    try {
      const payment = await db.payment.update({
        where: { id },
        data: { status },
      })
      return mapPrismaPaymentToDomain(payment)
    } catch (error) {
      if (isConnectionError(error)) {
        console.warn(
          '[PrismaPaymentRepository.updateStatus] DB connection failed, using in-memory store.'
        )
        const found = IN_MEMORY_PAYMENTS.find((p) => p.id === id)
        if (!found) throw new Error(`Payment ${id} not found in-memory`)

        found.status = status
        found.updatedAt = new Date()

        return found
      }
      throw error
    }
  }
}
