/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocationService } from '@/services/locations/LocationService'
import { hasPermission, requirePermission } from '@/lib/permissions'
import type { ILocationRepository } from '@/repositories'
import type { LocationDTO, UserRole } from '@/types'
import type { SessionPayload } from '@/lib/session'

describe('Módulo de Administración de Sucursales (FASE 19 - SUPERADMIN)', () => {
  let locationService: LocationService
  let mockLocationRepo: any

  const makeSession = (role: UserRole, orgId = 'org-A'): SessionPayload => ({
    userId: `u-${role.toLowerCase()}`,
    organizationId: orgId,
    locationId: 'loc-A',
    role,
    username: role.toLowerCase(),
    name: `User ${role}`,
    expiresAt: Date.now() + 3600000,
  })

  const locOrgA: LocationDTO = {
    id: 'loc-A',
    organizationId: 'org-A',
    name: 'Sucursal Org A',
    type: 'RESTAURANT',
    slug: 'sucursal-org-a',
    address: 'Av. Providencia 100',
    city: 'Santiago',
    country: 'CL',
    timezone: 'America/Santiago',
    phone: '+56911111111',
    currency: 'CLP',
    taxRate: 0.19,
    isActive: true,
    operatingHours: {},
    settings: {},
    createdAt: new Date('2026-08-01T10:00:00Z'),
    updatedAt: new Date('2026-08-01T10:00:00Z'),
    deletedAt: null,
  }

  const locOrgB: LocationDTO = {
    id: 'loc-B',
    organizationId: 'org-B',
    name: 'Sucursal Org B',
    type: 'FOOD_TRUCK',
    slug: 'sucursal-org-b',
    address: 'Av. Las Condes 500',
    city: 'Santiago',
    country: 'CL',
    timezone: 'America/Santiago',
    phone: '+56922222222',
    currency: 'CLP',
    taxRate: 0.19,
    isActive: true,
    operatingHours: {},
    settings: {},
    createdAt: new Date('2026-08-02T10:00:00Z'),
    updatedAt: new Date('2026-08-02T10:00:00Z'),
    deletedAt: null,
  }

  beforeEach(() => {
    mockLocationRepo = {
      findByOrganization: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      toggleActive: vi.fn(),
    }

    locationService = new LocationService(mockLocationRepo as ILocationRepository)
  })

  describe('1. Matriz RBAC para Módulo de Sucursales', () => {
    it('SUPERADMIN debe tener locations.view y locations.manage de forma exclusiva', () => {
      expect(hasPermission('SUPERADMIN', 'locations.view')).toBe(true)
      expect(hasPermission('SUPERADMIN', 'locations.manage')).toBe(true)

      expect(hasPermission('OWNER', 'locations.view')).toBe(false)
      expect(hasPermission('OWNER', 'locations.manage')).toBe(false)

      expect(hasPermission('ADMIN', 'locations.view')).toBe(false)
      expect(hasPermission('ADMIN', 'locations.manage')).toBe(false)

      expect(hasPermission('MANAGER', 'locations.view')).toBe(false)
      expect(hasPermission('MANAGER', 'locations.manage')).toBe(false)

      expect(hasPermission('CASHIER', 'locations.view')).toBe(false)
      expect(hasPermission('CASHIER', 'locations.manage')).toBe(false)

      expect(hasPermission('KITCHEN', 'locations.view')).toBe(false)
      expect(hasPermission('KITCHEN', 'locations.manage')).toBe(false)
    })
  })

  describe('2. Pruebas de Autorización y Casos de Seguridad FASE 19', () => {
    it('Caso 1: SUPERADMIN en Org A puede administrar Location A', async () => {
      mockLocationRepo.findById.mockResolvedValue(locOrgA)
      mockLocationRepo.update.mockResolvedValue({ ...locOrgA, name: 'Editada por Superadmin' })

      const session = makeSession('SUPERADMIN', 'org-A')

      expect(() => requirePermission(session, 'locations.manage')).not.toThrow()

      const res = await locationService.updateLocation(
        'loc-A',
        session.organizationId,
        { name: 'Editada por Superadmin' },
        true
      )

      expect(res.name).toBe('Editada por Superadmin')
    })

    it('Caso 2: SUPERADMIN en Org A puede administrar Location B (Org B) por alcance global', async () => {
      mockLocationRepo.findById.mockResolvedValue(locOrgB)
      mockLocationRepo.toggleActive.mockResolvedValue({ ...locOrgB, isActive: false })

      const session = makeSession('SUPERADMIN', 'org-A')

      expect(() => requirePermission(session, 'locations.manage')).not.toThrow()

      const res = await locationService.toggleLocationActive('loc-B', 'org-B', false, true)

      expect(res.isActive).toBe(false)
    })

    it('Caso 3: OWNER Org A intentando administrar Location A -> Debe ser rechazado por RBAC', () => {
      const session = makeSession('OWNER', 'org-A')

      expect(() => requirePermission(session, 'locations.view')).toThrow(/no tiene el permiso/)
      expect(() => requirePermission(session, 'locations.manage')).toThrow(/no tiene el permiso/)
    })

    it('Caso 4: OWNER Org A intentando administrar Location B -> Debe ser rechazado por RBAC', () => {
      const session = makeSession('OWNER', 'org-A')

      expect(() => requirePermission(session, 'locations.manage')).toThrow(/no tiene el permiso/)
    })

    it('Caso 5: ADMIN Org A intentando administrar Location A -> Debe ser rechazado por RBAC', () => {
      const session = makeSession('ADMIN', 'org-A')

      expect(() => requirePermission(session, 'locations.view')).toThrow(/no tiene el permiso/)
      expect(() => requirePermission(session, 'locations.manage')).toThrow(/no tiene el permiso/)
    })

    it('Caso 6: ADMIN intenta acceder directamente a /dashboard/locations -> Debe ser rechazado', () => {
      const session = makeSession('ADMIN', 'org-A')

      expect(() => requirePermission(session, 'locations.view')).toThrow(/no tiene el permiso/)
    })

    it('Caso 7: OWNER intenta llamar directamente a POST /api/locations -> Debe ser rechazado', () => {
      const session = makeSession('OWNER', 'org-A')

      expect(() => requirePermission(session, 'locations.manage')).toThrow(/no tiene el permiso/)
    })

    it('Caso 8: ADMIN intenta llamar directamente a PATCH /api/locations/[id] -> Debe ser rechazado', () => {
      const session = makeSession('ADMIN', 'org-A')

      expect(() => requirePermission(session, 'locations.manage')).toThrow(/no tiene el permiso/)
    })
  })
})
