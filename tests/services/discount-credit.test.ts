import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CreateDiscountCreditService,
  UpdateDiscountCreditService,
  CalculateDiscountCreditService,
  DuplicateDiscountCreditService,
  DeleteDiscountCreditService,
} from '@/services/discounts'
import type { IDiscountCreditRepository } from '@/repositories'
import { ValidationError, ConflictError, NotFoundError } from '@/lib/errors'

type MockDiscountCreditRepo = {
  [K in keyof IDiscountCreditRepository]: ReturnType<typeof vi.fn>
}

describe('Discount & Credit Service Domain Flow', () => {
  let mockRepo: MockDiscountCreditRepo
  let createService: CreateDiscountCreditService
  let updateService: UpdateDiscountCreditService
  let calculateService: CalculateDiscountCreditService
  let duplicateService: DuplicateDiscountCreditService
  let deleteService: DeleteDiscountCreditService

  const demoBenefit = {
    id: 'benefit123',
    organizationId: 'org123',
    locationId: 'loc123',
    name: 'Cliente Frecuente',
    description: '10% de descuento',
    type: 'DISCOUNT',
    valueType: 'PERCENTAGE',
    value: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      findActive: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
    } as unknown as MockDiscountCreditRepo

    createService = new CreateDiscountCreditService(
      mockRepo as unknown as IDiscountCreditRepository
    )
    updateService = new UpdateDiscountCreditService(
      mockRepo as unknown as IDiscountCreditRepository
    )
    calculateService = new CalculateDiscountCreditService(
      mockRepo as unknown as IDiscountCreditRepository
    )
    duplicateService = new DuplicateDiscountCreditService(
      mockRepo as unknown as IDiscountCreditRepository
    )
    deleteService = new DeleteDiscountCreditService(
      mockRepo as unknown as IDiscountCreditRepository
    )
  })

  describe('CreateDiscountCreditService', () => {
    it('debe lanzar ValidationError si el nombre está vacío', async () => {
      await expect(
        createService.execute({
          organizationId: 'org123',
          name: '',
          type: 'DISCOUNT',
          valueType: 'PERCENTAGE',
          value: 10,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ValidationError si el porcentaje es menor o igual a 0 o mayor a 100', async () => {
      await expect(
        createService.execute({
          organizationId: 'org123',
          name: 'Promo 0%',
          type: 'DISCOUNT',
          valueType: 'PERCENTAGE',
          value: 0,
        })
      ).rejects.toThrow(ValidationError)

      await expect(
        createService.execute({
          organizationId: 'org123',
          name: 'Promo 101%',
          type: 'DISCOUNT',
          valueType: 'PERCENTAGE',
          value: 101,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ValidationError si el monto fijo es menor o igual a 0', async () => {
      await expect(
        createService.execute({
          organizationId: 'org123',
          name: 'Promo Fija $0',
          type: 'DISCOUNT',
          valueType: 'FIXED_AMOUNT',
          value: 0,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ValidationError si el tipo es CREDIT y la modalidad no es FIXED_AMOUNT', async () => {
      await expect(
        createService.execute({
          organizationId: 'org123',
          name: 'Crédito Porcentaje',
          type: 'CREDIT',
          valueType: 'PERCENTAGE',
          value: 10,
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ConflictError si ya existe un beneficio con el mismo nombre en la organización', async () => {
      mockRepo.findMany.mockResolvedValue([demoBenefit])

      await expect(
        createService.execute({
          organizationId: 'org123',
          name: 'Cliente Frecuente',
          type: 'DISCOUNT',
          valueType: 'PERCENTAGE',
          value: 15,
        })
      ).rejects.toThrow(ConflictError)
    })

    it('debe crear un descuento válido si cumple todas las reglas', async () => {
      mockRepo.findMany.mockResolvedValue([])
      mockRepo.create.mockResolvedValue({
        id: 'new_benefit',
        organizationId: 'org123',
        locationId: 'loc123',
        name: 'Promo 15%',
        type: 'DISCOUNT',
        valueType: 'PERCENTAGE',
        value: 15,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })

      const res = await createService.execute({
        organizationId: 'org123',
        locationId: 'loc123',
        name: 'Promo 15%',
        type: 'DISCOUNT',
        valueType: 'PERCENTAGE',
        value: 15,
      })

      expect(res.name).toBe('Promo 15%')
      expect(mockRepo.create).toHaveBeenCalledOnce()
    })
  })

  describe('UpdateDiscountCreditService', () => {
    it('debe lanzar NotFoundError si el beneficio no existe', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(
        updateService.execute('notfound', {
          name: 'Editado',
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('debe actualizar los campos del beneficio correctamente', async () => {
      mockRepo.findById.mockResolvedValue(demoBenefit)
      mockRepo.update.mockResolvedValue({
        ...demoBenefit,
        name: 'Cliente Frecuente Gold',
      })

      const res = await updateService.execute('benefit123', {
        name: 'Cliente Frecuente Gold',
      })

      expect(res.name).toBe('Cliente Frecuente Gold')
    })
  })

  describe('DuplicateDiscountCreditService', () => {
    it('debe lanzar NotFoundError si el beneficio a duplicar no existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(duplicateService.execute('invalid')).rejects.toThrow(NotFoundError)
    })

    it('debe crear un nuevo beneficio con el nombre sufijado "- Copia" e inactivo por defecto', async () => {
      mockRepo.findById.mockResolvedValue(demoBenefit)
      mockRepo.create.mockImplementation(async (input) => ({
        id: 'new_dup_id',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }))

      const res = await duplicateService.execute('benefit123')

      expect(res.name).toBe('Cliente Frecuente - Copia')
      expect(res.isActive).toBe(false)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cliente Frecuente - Copia',
          isActive: false,
        })
      )
    })
  })

  describe('DeleteDiscountCreditService', () => {
    it('debe lanzar NotFoundError si el beneficio a eliminar no existe', async () => {
      mockRepo.findById.mockResolvedValue(null)
      await expect(deleteService.execute('invalid')).rejects.toThrow(NotFoundError)
    })

    it('debe llamar al método delete del repositorio para borrado lógico', async () => {
      mockRepo.findById.mockResolvedValue(demoBenefit)
      mockRepo.delete.mockResolvedValue(undefined)

      await deleteService.execute('benefit123')

      expect(mockRepo.delete).toHaveBeenCalledWith('benefit123')
    })
  })

  describe('CalculateDiscountCreditService', () => {
    it('debe lanzar ValidationError si el subtotal es negativo', async () => {
      await expect(calculateService.execute('benefit123', -500)).rejects.toThrow(ValidationError)
    })

    it('debe calcular correctamente un descuento porcentual', async () => {
      mockRepo.findById.mockResolvedValue(demoBenefit) // 10%

      const res = await calculateService.execute('benefit123', 30000)

      expect(res.appliedAmount).toBe(3000)
      expect(res.snapshot.discountCreditName).toBe('Cliente Frecuente')
      expect(res.snapshot.discountCreditAppliedAmount).toBe(3000)
    })

    it('debe calcular correctamente un crédito de monto fijo', async () => {
      const fixedBenefit = {
        ...demoBenefit,
        type: 'CREDIT',
        valueType: 'FIXED_AMOUNT',
        value: 5000,
      }
      mockRepo.findById.mockResolvedValue(fixedBenefit)

      const res = await calculateService.execute('benefit123', 30000)

      expect(res.appliedAmount).toBe(5000)
    })

    it('debe topar el descuento para que el total nunca sea negativo (aplicación a subtotal bajo)', async () => {
      const fixedBenefit = {
        ...demoBenefit,
        type: 'CREDIT',
        valueType: 'FIXED_AMOUNT',
        value: 10000,
      }
      mockRepo.findById.mockResolvedValue(fixedBenefit)

      // Subtotal de 8000 con descuento de 10000 -> debe aplicar max 8000
      const res = await calculateService.execute('benefit123', 8000)

      expect(res.appliedAmount).toBe(8000)
    })

    it('debe lanzar ValidationError si el beneficio está inactivo', async () => {
      const inactiveBenefit = {
        ...demoBenefit,
        isActive: false,
      }
      mockRepo.findById.mockResolvedValue(inactiveBenefit)

      await expect(calculateService.execute('benefit123', 30000)).rejects.toThrow(ValidationError)
    })
  })
})
