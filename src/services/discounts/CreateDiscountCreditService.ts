import 'server-only'

import type { IDiscountCreditRepository } from '@/repositories'
import type { DiscountCredit, CreateDiscountCreditInput, DiscountCreditType } from '@/types'
import { ValidationError, ConflictError } from '@/lib/errors'

export class CreateDiscountCreditService {
  constructor(private readonly repo: IDiscountCreditRepository) {}

  /**
   * Crea un nuevo beneficio comercial (descuento o crédito).
   * Aplica reglas de validación según tipo y modalidad de valor.
   */
  async execute(data: CreateDiscountCreditInput): Promise<DiscountCredit> {
    const name = data.name.trim()
    if (!name) {
      throw new ValidationError('El nombre del beneficio es obligatorio.')
    }

    this.validateValue(data.type, data.valueType, data.value)

    // Validate CREDIT only allows FIXED_AMOUNT
    if (data.type === 'CREDIT' && data.valueType !== 'FIXED_AMOUNT') {
      throw new ValidationError('Los créditos solo admiten modalidad de monto fijo (FIXED_AMOUNT).')
    }

    // Check for duplicate name within organization
    const existing = await this.repo.findMany({
      organizationId: data.organizationId,
      locationId: data.locationId,
      search: name,
    })
    const duplicate = existing.find(
      (dc) => dc.name.toLowerCase() === name.toLowerCase() && dc.deletedAt === null
    )
    if (duplicate) {
      throw new ConflictError(
        `Ya existe un beneficio con el nombre "${name}" en esta organización.`
      )
    }

    return this.repo.create({ ...data, name })
  }

  private validateValue(type: DiscountCreditType, valueType: string, value: number): void {
    if (valueType === 'PERCENTAGE') {
      if (value <= 0 || value > 100) {
        throw new ValidationError('El porcentaje debe estar entre 1 y 100.')
      }
    } else if (valueType === 'FIXED_AMOUNT') {
      if (value <= 0) {
        throw new ValidationError('El monto fijo debe ser mayor que cero.')
      }
    }
    // Silence unused param warning
    void type
  }
}
