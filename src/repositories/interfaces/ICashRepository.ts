import type { CashSession, CashMovement, CashAudit, User, Prisma } from '@/generated/prisma'

export interface ICashRepository {
  findUserById(userId: string): Promise<User | null>
  findOpenSession(locationId: string, userId: string): Promise<CashSession | null>
  createSession(data: {
    organizationId: string
    locationId: string
    userId: string
    openingBalance: number
    registerName?: string
  }): Promise<CashSession>
  closeSession(
    id: string,
    data: {
      closingBalance: number
      expectedBalance: number
      difference: number
      observations?: string
      closingReportSnapshot: unknown
    }
  ): Promise<CashSession>
  reopenSession(
    id: string,
    data: {
      reopenedById: string
      reopenedReason: string
    }
  ): Promise<CashSession>
  findById(id: string): Promise<CashSession | null>
  findSessionWithDetails(id: string): Promise<(CashSession & { movements: CashMovement[] }) | null>
  findHistory(
    locationId: string,
    filters?: {
      startDate?: Date
      endDate?: Date
      userId?: string
    }
  ): Promise<CashSession[]>
  createMovement(
    sessionId: string,
    data: {
      amount: number
      type: 'IN' | 'OUT'
      reason: string
    }
  ): Promise<CashMovement>
  findMovementsBySessionId(sessionId: string): Promise<CashMovement[]>
  createAuditLog(data: {
    organizationId: string
    locationId: string
    userId: string
    sessionId?: string
    action: string
    ipAddress?: string
    details?: unknown
  }): Promise<CashAudit>
  findAudits(filters: {
    organizationId: string
    locationId?: string
    sessionId?: string
    userId?: string
  }): Promise<CashAudit[]>
}
