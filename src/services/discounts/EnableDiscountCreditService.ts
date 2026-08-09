import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit } from '@/types'
import { NotFoundError } from '@/lib/errors'

export class EnableDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /** Activa un beneficio comercial (isActive = true). */
  async execute(id: string): Promise<DiscountCredit> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw new NotFoundError('DiscountCredit', id)
    }
    return this.repo.enable(id)
  }
}
