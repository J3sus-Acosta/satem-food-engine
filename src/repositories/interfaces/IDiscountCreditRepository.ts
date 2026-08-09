import type {
  DiscountCredit,
  CreateDiscountCreditInput,
  UpdateDiscountCreditInput,
  DiscountCreditFilters,
} from '@/types'

export interface IDiscountCreditRepository {
  /**
   * Crea un nuevo beneficio comercial (descuento o crédito).
   */
  create(data: CreateDiscountCreditInput): Promise<DiscountCredit>

  /**
   * Actualiza los campos editables de un beneficio comercial.
   */
  update(id: string, data: UpdateDiscountCreditInput): Promise<DiscountCredit>

  /**
   * Busca un beneficio por su ID técnico (incluye inactivos, excluye deleted).
   */
  findById(id: string): Promise<DiscountCredit | null>

  /**
   * Lista beneficios aplicando filtros de organización, local, tipo y estado.
   */
  findMany(filters: DiscountCreditFilters): Promise<DiscountCredit[]>

  /**
   * Lista los beneficios activos disponibles para un local en POS.
   * Incluye beneficios de la organización (locationId = null) y del local específico.
   */
  findActive(organizationId: string, locationId?: string | null): Promise<DiscountCredit[]>

  /**
   * Activa un beneficio (isActive = true).
   */
  enable(id: string): Promise<DiscountCredit>

  /**
   * Desactiva un beneficio (isActive = false). No lo elimina.
   */
  disable(id: string): Promise<DiscountCredit>

  /**
   * Elimina lógicamente un beneficio (deletedAt = now, isActive = false).
   */
  delete(id: string): Promise<void>
}
