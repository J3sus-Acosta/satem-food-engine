import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit, DiscountCreditFilters } from '@/types'

export class ListDiscountCreditsService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Lista los beneficios de una organización con filtros opcionales.
   * Respeta el aislamiento multi-tenant por organizationId.
   */
  async execute(filters: DiscountCreditFilters): Promise<DiscountCredit[]> {
    return this.repo.findMany(filters)
  }
}
