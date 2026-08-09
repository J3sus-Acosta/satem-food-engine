import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit, DiscountCreditSnapshot } from '@/types'
import { ValidationError, NotFoundError } from '@/lib/errors'

export class CalculateDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Calcula el monto aplicable de un DiscountCredit sobre un subtotal dado.
   * Garantiza que el resultado nunca sea negativo y genera el snapshot histórico.
   *
   * @param discountCreditId - ID del beneficio a aplicar
   * @param subtotal - Subtotal de la orden sobre la que se aplica (>= 0)
   * @returns appliedAmount y snapshot para persistir en Order.metadata
   */
  async execute(
    discountCreditId: string,
    subtotal: number
  ): Promise<{
    appliedAmount: number
    snapshot: DiscountCreditSnapshot
    discountCredit: DiscountCredit
  }> {
    if (subtotal < 0) {
      throw new ValidationError('El subtotal no puede ser negativo.')
    }

    const dc = await this.repo.findById(discountCreditId)
    if (!dc) {
      throw new NotFoundError('DiscountCredit', discountCreditId)
    }

    if (!dc.isActive) {
      throw new ValidationError(`El beneficio "${dc.name}" está inactivo y no puede aplicarse.`)
    }

    let appliedAmount: number

    if (dc.valueType === 'PERCENTAGE') {
      appliedAmount = Math.round((subtotal * dc.value) / 100)
    } else {
      // FIXED_AMOUNT
      appliedAmount = dc.value
    }

    // Never exceed the subtotal (total can't go negative)
    appliedAmount = Math.min(appliedAmount, subtotal)
    appliedAmount = Math.max(0, appliedAmount)

    const snapshot: DiscountCreditSnapshot = {
      discountCreditId: dc.id,
      discountCreditName: dc.name,
      discountCreditType: dc.type,
      discountCreditValueType: dc.valueType,
      discountCreditValue: dc.value,
      discountCreditAppliedAmount: appliedAmount,
    }

    return { appliedAmount, snapshot, discountCredit: dc }
  }
}
