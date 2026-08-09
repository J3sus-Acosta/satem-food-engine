import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit } from '@/types'
import { NotFoundError } from '@/lib/errors'

export class DisableDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Desactiva un beneficio comercial (isActive = false).
   * No lo elimina físicamente — preserva trazabilidad histórica de órdenes.
   */
  async execute(id: string): Promise<DiscountCredit> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError('DiscountCredit', id)
    }
    return this.repo.disable(id)
  }
}
