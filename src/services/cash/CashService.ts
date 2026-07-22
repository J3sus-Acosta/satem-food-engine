import 'server-only'

import type { ICashRepository, IOrderRepository } from '@/repositories'
import type { CashSession, CashMovement, CashAudit } from '@/generated/prisma'
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '@/lib/errors'
import { ReportingService } from './ReportingService'

export class CashService {
  private readonly reportingService: ReportingService

  constructor(
    private readonly cashRepo: ICashRepository,
    private readonly orderRepo: IOrderRepository
  ) {
    this.reportingService = new ReportingService(orderRepo)
  }

  /**
   * Abre un nuevo turno de caja para un usuario y sucursal.
   * Valida que no exista ya un turno abierto para ese operador en la sucursal.
   */
  async openSession(
    organizationId: string,
    locationId: string,
    userId: string,
    openingBalance: number,
    registerName?: string,
    ipAddress?: string
  ): Promise<CashSession> {
    if (openingBalance < 0) {
      throw new ValidationError('El saldo inicial de apertura no puede ser negativo.')
    }

    // Regla de Negocio: Impedir múltiples turnos abiertos para el mismo usuario
    const openSession = await this.cashRepo.findOpenSession(locationId, userId)
    if (openSession) {
      throw new ConflictError(
        `Ya existe un turno de caja abierto (ID: ${openSession.id}) para este operador en esta sucursal.`
      )
    }

    // Crear sesión
    const session = await this.cashRepo.createSession({
      organizationId,
      locationId,
      userId,
      openingBalance,
      registerName: registerName || 'Caja Principal',
    })

    // Registrar en auditoría
    await this.cashRepo.createAuditLog({
      organizationId,
      locationId,
      userId,
      sessionId: session.id,
      action: 'OPEN_SESSION',
      ipAddress,
      details: { openingBalance, registerName },
    })

    return session
  }

  /**
   * Obtiene la sesión activa actual para un operador en una sucursal.
   */
  async getCurrentSession(locationId: string, userId: string): Promise<CashSession | null> {
    return this.cashRepo.findOpenSession(locationId, userId)
  }

  /**
   * Registra un movimiento de caja manual (Ingreso / Egreso).
   */
  async addMovement(
    sessionId: string,
    amount: number,
    type: 'IN' | 'OUT',
    reason: string,
    userId: string,
    ipAddress?: string
  ): Promise<CashMovement> {
    const session = await this.cashRepo.findById(sessionId)
    if (!session) {
      throw new NotFoundError('Session', sessionId)
    }

    if (session.status !== 'OPEN') {
      throw new ConflictError('No se pueden agregar movimientos a un turno de caja cerrado.')
    }

    if (amount <= 0) {
      throw new ValidationError('El monto del movimiento debe ser mayor a cero.')
    }

    const movement = await this.cashRepo.createMovement(sessionId, {
      amount,
      type,
      reason: reason.trim(),
    })

    // Registrar auditoría
    await this.cashRepo.createAuditLog({
      organizationId: session.organizationId,
      locationId: session.locationId,
      userId,
      sessionId: session.id,
      action: type === 'IN' ? 'PRINT_REPORT' : 'PRINT_REPORT', // generic action log or extend
      ipAddress,
      details: { movementId: movement.id, amount, type, reason },
    })

    return movement
  }

  /**
   * Cierra un turno de caja calculando el balance esperado y diferencias.
   */
  async closeSession(
    sessionId: string,
    closingBalance: number,
    observations?: string,
    ipAddress?: string
  ): Promise<CashSession> {
    const session = await this.cashRepo.findSessionWithDetails(sessionId)
    if (!session) {
      throw new NotFoundError('Session', sessionId)
    }

    if (session.status !== 'OPEN') {
      throw new ConflictError('El turno de caja ya se encuentra cerrado.')
    }

    // 1. Obtener órdenes completadas/pagadas durante el turno
    const report = await this.reportingService.generateReport({
      organizationId: session.organizationId,
      locationId: session.locationId,
      startDate: session.openedAt,
      endDate: new Date(),
      userId: session.userId,
    })

    // 2. Calcular saldo esperado en efectivo (openingBalance + Efectivo cobrado + IN - OUT)
    const movements = session.movements || []
    const totalIn = movements
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + Number(m.amount), 0)
    const totalOut = movements
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + Number(m.amount), 0)

    // Sumar el cobro registrado con método "CASH" (Efectivo)
    const cashPaymentsData = report.payments.find((p) => p.method === 'CASH')
    const totalPaidInCash = cashPaymentsData ? cashPaymentsData.amount : 0

    const expectedBalance = Number(session.openingBalance) + totalPaidInCash + totalIn - totalOut
    const difference = closingBalance - expectedBalance

    // 3. Persistir cierre
    const closedSession = await this.cashRepo.closeSession(sessionId, {
      closingBalance,
      expectedBalance,
      difference,
      observations: observations?.trim(),
      closingReportSnapshot: report,
    })

    // 4. Registrar auditoría
    await this.cashRepo.createAuditLog({
      organizationId: session.organizationId,
      locationId: session.locationId,
      userId: session.userId,
      sessionId: session.id,
      action: 'CLOSE_SESSION',
      ipAddress,
      details: { closingBalance, expectedBalance, difference, observations },
    })

    return closedSession
  }

  /**
   * Reabre una caja cerrada. Acción exclusiva de Administradores.
   */
  async reopenSession(
    sessionId: string,
    reopenedById: string,
    reason: string,
    ipAddress?: string
  ): Promise<CashSession> {
    // 1. Validar que el usuario que reabre sea ADMIN
    const user = await this.cashRepo.findUserById(reopenedById)
    if (!user) {
      throw new NotFoundError('User', reopenedById)
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenError(
        'Solo los administradores tienen permiso para reabrir un turno de caja.'
      )
    }

    // 2. Validar sesión
    const session = await this.cashRepo.findById(sessionId)
    if (!session) {
      throw new NotFoundError('Session', sessionId)
    }

    if (session.status !== 'CLOSED') {
      throw new ConflictError('No se puede reabrir un turno de caja que ya está abierto.')
    }

    if (!reason || !reason.trim()) {
      throw new ValidationError('Debe indicar un motivo justificado para reabrir el turno.')
    }

    // 3. Reabrir sesión
    const reopenedSession = await this.cashRepo.reopenSession(sessionId, {
      reopenedById,
      reopenedReason: reason.trim(),
    })

    // 4. Registrar auditoría
    await this.cashRepo.createAuditLog({
      organizationId: session.organizationId,
      locationId: session.locationId,
      userId: reopenedById,
      sessionId: session.id,
      action: 'REOPEN_SESSION',
      ipAddress,
      details: { reason, previousStatus: 'CLOSED' },
    })

    return reopenedSession
  }

  /**
   * Obtiene la sesión por su identificador único.
   */
  async getSession(id: string): Promise<CashSession & { movements: CashMovement[] }> {
    const session = await this.cashRepo.findSessionWithDetails(id)
    if (!session) {
      throw new NotFoundError('Session', id)
    }
    return session
  }

  /**
   * Obtiene el historial de sesiones para un local.
   */
  async getHistory(
    locationId: string,
    filters?: { startDate?: Date; endDate?: Date; userId?: string }
  ): Promise<CashSession[]> {
    return this.cashRepo.findHistory(locationId, filters)
  }

  /**
   * Obtiene logs de auditoría asociados a la caja.
   */
  async getAudits(filters: {
    organizationId: string
    locationId?: string
    sessionId?: string
    userId?: string
  }): Promise<CashAudit[]> {
    return this.cashRepo.findAudits(filters)
  }

  /**
   * Registra una acción de impresión o exportación en la auditoría.
   */
  async logReportAction(
    organizationId: string,
    locationId: string,
    userId: string,
    sessionId: string | undefined,
    action: 'PRINT_REPORT' | 'EXPORT_PDF' | 'EXPORT_EXCEL',
    ipAddress?: string
  ): Promise<CashAudit> {
    return this.cashRepo.createAuditLog({
      organizationId,
      locationId,
      userId,
      sessionId,
      action,
      ipAddress,
    })
  }
}
