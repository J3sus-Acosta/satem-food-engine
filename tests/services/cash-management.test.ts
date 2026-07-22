import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CashService } from '@/services/cash/CashService'
import type { ICashRepository, IOrderRepository } from '@/repositories'
import { ValidationError, ConflictError, ForbiddenError } from '@/lib/errors'

type MockCashRepo = {
  [K in keyof ICashRepository]: ReturnType<typeof vi.fn>
}
type MockOrderRepo = {
  [K in keyof IOrderRepository]: ReturnType<typeof vi.fn>
}

describe('Cash Management Domain Flow', () => {
  let cashService: CashService
  let mockCashRepo: MockCashRepo
  let mockOrderRepo: MockOrderRepo

  beforeEach(() => {
    mockCashRepo = {
      findUserById: vi.fn(),
      findOpenSession: vi.fn(),
      createSession: vi.fn(),
      closeSession: vi.fn(),
      reopenSession: vi.fn(),
      findById: vi.fn(),
      findSessionWithDetails: vi.fn(),
      findHistory: vi.fn(),
      createMovement: vi.fn(),
      findMovementsBySessionId: vi.fn(),
      createAuditLog: vi.fn(),
      findAudits: vi.fn(),
    } as unknown as MockCashRepo

    mockOrderRepo = {
      findDetailedOrders: vi.fn(),
    } as unknown as MockOrderRepo

    cashService = new CashService(
      mockCashRepo as unknown as ICashRepository,
      mockOrderRepo as unknown as IOrderRepository
    )
  })

  describe('openSession', () => {
    it('debe lanzar ValidationError si el saldo inicial es negativo', async () => {
      await expect(cashService.openSession('org-1', 'loc-1', 'user-1', -100)).rejects.toThrow(
        ValidationError
      )
    })

    it('debe lanzar ConflictError si el operador ya tiene un turno abierto en la sucursal', async () => {
      mockCashRepo.findOpenSession.mockResolvedValueOnce({ id: 'sess-active', status: 'OPEN' })

      await expect(cashService.openSession('org-1', 'loc-1', 'user-1', 50000)).rejects.toThrow(
        ConflictError
      )
    })

    it('debe abrir la sesión y registrar logs en auditoría si los datos son correctos', async () => {
      mockCashRepo.findOpenSession.mockResolvedValueOnce(null)
      mockCashRepo.createSession.mockResolvedValueOnce({ id: 'sess-new', status: 'OPEN' })
      mockCashRepo.createAuditLog.mockResolvedValueOnce({ id: 'audit-1' })

      const session = await cashService.openSession('org-1', 'loc-1', 'user-1', 50000)

      expect(session.id).toBe('sess-new')
      expect(mockCashRepo.createSession).toHaveBeenCalledWith({
        organizationId: 'org-1',
        locationId: 'loc-1',
        userId: 'user-1',
        openingBalance: 50000,
        registerName: 'Caja Principal',
      })
      expect(mockCashRepo.createAuditLog).toHaveBeenCalled()
    })
  })

  describe('addMovement', () => {
    it('debe lanzar ConflictError si la caja no está abierta', async () => {
      mockCashRepo.findById.mockResolvedValueOnce({ id: 'sess-1', status: 'CLOSED' })

      await expect(
        cashService.addMovement('sess-1', 10000, 'IN', 'Aporte de sencillo', 'user-1')
      ).rejects.toThrow(ConflictError)
    })

    it('debe registrar el movimiento manual si el turno está abierto', async () => {
      mockCashRepo.findById.mockResolvedValueOnce({
        id: 'sess-1',
        status: 'OPEN',
        organizationId: 'org-1',
        locationId: 'loc-1',
      })
      mockCashRepo.createMovement.mockResolvedValueOnce({ id: 'mov-1', amount: 10000, type: 'IN' })

      const movement = await cashService.addMovement(
        'sess-1',
        10000,
        'IN',
        'Sencillo extra',
        'user-1'
      )

      expect(movement.id).toBe('mov-1')
      expect(mockCashRepo.createMovement).toHaveBeenCalledWith('sess-1', {
        amount: 10000,
        type: 'IN',
        reason: 'Sencillo extra',
      })
    })
  })

  describe('closeSession', () => {
    it('debe cuadrar la caja y calcular la diferencia correctamente', async () => {
      const mockSession = {
        id: 'sess-1',
        organizationId: 'org-1',
        locationId: 'loc-1',
        userId: 'user-1',
        status: 'OPEN',
        openingBalance: 50000,
        movements: [
          { amount: 10000, type: 'IN' }, // +10000
          { amount: 5000, type: 'OUT' }, // -5000
        ],
      }

      mockCashRepo.findSessionWithDetails.mockResolvedValueOnce(mockSession)

      // Simulate orders during turn: 1 cash paid order for $30000
      mockOrderRepo.findDetailedOrders.mockResolvedValueOnce([
        {
          id: 'ord-1',
          totalAmount: 30000,
          subtotal: 30000,
          taxAmount: 0,
          discountAmount: 0,
          items: [],
          payment: { provider: 'CASH', status: 'PAID', amount: 30000 },
        },
      ])

      mockCashRepo.closeSession.mockResolvedValueOnce({
        ...mockSession,
        status: 'CLOSED',
        expectedBalance: 85000, // 50000 + 30000 + 10000 - 5000 = 85000
        closingBalance: 83000, // user reports 83000 counted
        difference: -2000, // difference is -2000
      })

      const closed = await cashService.closeSession('sess-1', 83000, 'Faltante de 2000')

      expect(closed.status).toBe('CLOSED')
      expect(mockCashRepo.closeSession).toHaveBeenCalledWith('sess-1', {
        closingBalance: 83000,
        expectedBalance: 85000,
        difference: -2000,
        observations: 'Faltante de 2000',
        closingReportSnapshot: expect.any(Object),
      })
    })
  })

  describe('reopenSession', () => {
    it('debe lanzar ForbiddenError si el usuario no es administrador', async () => {
      mockCashRepo.findUserById.mockResolvedValueOnce({ id: 'user-1', role: 'CASHIER' })

      await expect(
        cashService.reopenSession('sess-1', 'user-1', 'Error al cerrar')
      ).rejects.toThrow(ForbiddenError)
    })

    it('debe lanzar ConflictError si la caja no está cerrada', async () => {
      mockCashRepo.findUserById.mockResolvedValueOnce({ id: 'user-1', role: 'ADMIN' })
      mockCashRepo.findById.mockResolvedValueOnce({ id: 'sess-1', status: 'OPEN' })

      await expect(cashService.reopenSession('sess-1', 'user-1', 'Reapertura')).rejects.toThrow(
        ConflictError
      )
    })

    it('debe reabrir el turno si el usuario es administrador y el turno está cerrado', async () => {
      mockCashRepo.findUserById.mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      mockCashRepo.findById.mockResolvedValueOnce({ id: 'sess-1', status: 'CLOSED' })
      mockCashRepo.reopenSession.mockResolvedValueOnce({ id: 'sess-1', status: 'OPEN' })

      const session = await cashService.reopenSession(
        'sess-1',
        'admin-1',
        'Error en arqueo contado'
      )

      expect(session.status).toBe('OPEN')
      expect(mockCashRepo.reopenSession).toHaveBeenCalledWith('sess-1', {
        reopenedById: 'admin-1',
        reopenedReason: 'Error en arqueo contado',
      })
    })
  })
})
