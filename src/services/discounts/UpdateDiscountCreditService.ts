import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit, UpdateDiscountCreditInput } from '@/types'
import { ValidationError, NotFoundError } from '@/lib/errors'

export class UpdateDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Actualiza nombre, descripción, valor y/o estado de un beneficio.
   * Respeta trazabilidad histórica: las órdenes ya cerradas no se ven afectadas.
   */
  async execute(id: string, data: UpdateDiscountCreditInput): Promise<DiscountCredit> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError('DiscountCredit', id)
    }

    if (data.name !== undefined) {
      const name = data.name.trim()
      if (!name) {
        throw new ValidationError('El nombre del beneficio no puede estar vacío.')
      }
    }

    const effectiveType = data.type ?? existing.type
    const effectiveValueType = data.valueType ?? existing.valueType
    const effectiveValue = data.value ?? existing.value

    if (effectiveType === 'CREDIT' && effectiveValueType !== 'FIXED_AMOUNT') {
      throw new ValidationError('Los créditos sólo admiten la modalidad de monto fijo.')
    }

    if (data.value !== undefined || data.valueType !== undefined) {
      if (effectiveValueType === 'PERCENTAGE') {
        if (effectiveValue <= 0 || effectiveValue > 100) {
          throw new ValidationError('El porcentaje debe estar entre 1 y 100.')
        }
      } else {
        if (effectiveValue <= 0) {
          throw new ValidationError('El monto fijo debe ser mayor que cero.')
        }
      }
    }

    return this.repo.update(id, data)
  }
}
