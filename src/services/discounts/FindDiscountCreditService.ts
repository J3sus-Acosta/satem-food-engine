import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit } from '@/types'
import { NotFoundError } from '@/lib/errors'

export class FindDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /** Busca un beneficio por ID. Lanza NotFoundError si no existe o fue eliminado. */
  async execute(id: string): Promise<DiscountCredit> {
    const found = await this.repo.findById(id)
    if (!found) {
      throw new NotFoundError('DiscountCredit', id)
    }
    return found
  }
}
