import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import { NotFoundError } from '@/lib/errors'

export class DeleteDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Elimina lógicamente un beneficio comercial (deletedAt = Date, isActive = false).
   */
  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError('DiscountCredit', id)
    }

    await this.repo.delete(id)
  }
}
