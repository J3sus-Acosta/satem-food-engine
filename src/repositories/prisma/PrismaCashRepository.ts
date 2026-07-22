import 'server-only'

import { db } from '@/server/db'
import type { ICashRepository } from '../interfaces/ICashRepository'
import type {
  CashSession,
  CashMovement,
  CashAudit,
  User,
  CashAuditAction,
} from '@/generated/prisma'
import { Prisma } from '@/generated/prisma'

export class PrismaCashRepository implements ICashRepository {
  async findUserById(userId: string): Promise<User | null> {
    return db.user.findFirst({
      where: { id: userId, deletedAt: null },
    })
  }

  async findOpenSession(locationId: string, userId: string): Promise<CashSession | null> {
    return db.cashSession.findFirst({
      where: {
        locationId,
        userId,
        status: 'OPEN',
        deletedAt: null,
      },
    })
  }

  async createSession(data: {
    organizationId: string
    locationId: string
    userId: string
    openingBalance: number
    registerName?: string
  }): Promise<CashSession> {
    return db.cashSession.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId,
        userId: data.userId,
        openingBalance: new Prisma.Decimal(data.openingBalance),
        registerName: data.registerName || 'Caja Principal',
        status: 'OPEN',
      },
    })
  }

  async closeSession(
    id: string,
    data: {
      closingBalance: number
      expectedBalance: number
      difference: number
      observations?: string
      closingReportSnapshot: unknown
    }
  ): Promise<CashSession> {
    return db.cashSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingBalance: new Prisma.Decimal(data.closingBalance),
        expectedBalance: new Prisma.Decimal(data.expectedBalance),
        difference: new Prisma.Decimal(data.difference),
        observations: data.observations || null,
        closingReportSnapshot:
          (data.closingReportSnapshot as Prisma.InputJsonValue) || Prisma.DbNull,
      },
    })
  }

  async reopenSession(
    id: string,
    data: {
      reopenedById: string
      reopenedReason: string
    }
  ): Promise<CashSession> {
    return db.cashSession.update({
      where: { id },
      data: {
        status: 'OPEN',
        closedAt: null,
        closingBalance: null,
        expectedBalance: null,
        difference: null,
        observations: null,
        closingReportSnapshot: Prisma.DbNull,
        reopenedAt: new Date(),
        reopenedById: data.reopenedById,
        reopenedReason: data.reopenedReason,
      },
    })
  }

  async findById(id: string): Promise<CashSession | null> {
    return db.cashSession.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findSessionWithDetails(
    id: string
  ): Promise<(CashSession & { movements: CashMovement[] }) | null> {
    return db.cashSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        movements: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async findHistory(
    locationId: string,
    filters?: {
      startDate?: Date
      endDate?: Date
      userId?: string
    }
  ): Promise<CashSession[]> {
    const whereClause: Prisma.CashSessionWhereInput = {
      locationId,
      deletedAt: null,
    }

    if (filters) {
      if (filters.userId) {
        whereClause.userId = filters.userId
      }
      if (filters.startDate || filters.endDate) {
        whereClause.openedAt = {}
        if (filters.startDate) {
          whereClause.openedAt.gte = filters.startDate
        }
        if (filters.endDate) {
          whereClause.openedAt.lte = filters.endDate
        }
      }
    }

    return db.cashSession.findMany({
      where: whereClause,
      orderBy: { openedAt: 'desc' },
      include: {
        user: true,
        reopenedBy: true,
      },
    })
  }

  async createMovement(
    sessionId: string,
    data: {
      amount: number
      type: 'IN' | 'OUT'
      reason: string
    }
  ): Promise<CashMovement> {
    return db.cashMovement.create({
      data: {
        sessionId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        reason: data.reason,
      },
    })
  }

  async findMovementsBySessionId(sessionId: string): Promise<CashMovement[]> {
    return db.cashMovement.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createAuditLog(data: {
    organizationId: string
    locationId: string
    userId: string
    sessionId?: string
    action: string
    ipAddress?: string
    details?: unknown
  }): Promise<CashAudit> {
    return db.cashAudit.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId,
        userId: data.userId,
        sessionId: data.sessionId || null,
        action: data.action as CashAuditAction,
        ipAddress: data.ipAddress || null,
        details: (data.details as Prisma.InputJsonValue) || Prisma.DbNull,
      },
    })
  }

  async findAudits(filters: {
    organizationId: string
    locationId?: string
    sessionId?: string
    userId?: string
  }): Promise<CashAudit[]> {
    const whereClause: Prisma.CashAuditWhereInput = {
      organizationId: filters.organizationId,
    }

    if (filters.locationId) whereClause.locationId = filters.locationId
    if (filters.sessionId) whereClause.sessionId = filters.sessionId
    if (filters.userId) whereClause.userId = filters.userId

    return db.cashAudit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    })
  }
}
