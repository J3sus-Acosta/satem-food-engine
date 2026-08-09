import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit } from '@/types'
import { NotFoundError } from '@/lib/errors'

export class DuplicateDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Duplica un beneficio comercial existente.
   * Asigna el nombre "${original} - Copia" e inactiva la copia por defecto.
   */
  async execute(id: string): Promise<DiscountCredit> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError('DiscountCredit', id)
    }

    return this.repo.create({
      organizationId: existing.organizationId,
      locationId: existing.locationId,
      name: `${existing.name} - Copia`,
      description: existing.description,
      type: existing.type,
      valueType: existing.valueType,
      value: Number(existing.value),
      isActive: false, // Inactive by default for safety
    })
  }
}
