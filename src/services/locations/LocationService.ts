import 'server-only'

import type { ILocationRepository } from '@/repositories'
import type { LocationDTO, CreateLocationInput, UpdateLocationInput } from '@/types'
import { NotFoundError, ValidationError } from '@/lib/errors'

/**
 * Servicio de dominio para la gestión de sucursales (Location).
 */
export class LocationService {
  constructor(private locationRepo: ILocationRepository) {}

  /**
   * Obtiene sucursales por organización o todas las sucursales si es SUPERADMIN.
   */
  async getLocationsByOrganization(
    organizationId?: string,
    isSuperAdmin?: boolean
  ): Promise<LocationDTO[]> {
    if (!isSuperAdmin && !organizationId) {
      throw new ValidationError('El ID de la organización es obligatorio.')
    }
    return this.locationRepo.findByOrganization(
      isSuperAdmin && !organizationId ? undefined : organizationId
    )
  }

  /**
   * Obtiene una sucursal por ID con validación multi-tenant o alcance global si es SUPERADMIN.
   */
  async getLocationById(
    id: string,
    organizationId?: string,
    isSuperAdmin?: boolean
  ): Promise<LocationDTO> {
    const loc = await this.locationRepo.findById(id)
    if (!loc) {
      throw new NotFoundError('Location', id)
    }
    if (!isSuperAdmin && loc.organizationId !== organizationId) {
      throw new NotFoundError('Location', id)
    }
    return loc
  }

  /**
   * Crea una nueva sucursal en la organización especificada.
   */
  async createLocation(data: CreateLocationInput): Promise<LocationDTO> {
    if (!data.organizationId) {
      throw new ValidationError('El ID de la organización es obligatorio.')
    }
    if (!data.name || !data.name.trim()) {
      throw new ValidationError('El nombre de la sucursal es obligatorio.')
    }

    return this.locationRepo.create({
      organizationId: data.organizationId,
      name: data.name.trim(),
      type: data.type || 'RESTAURANT',
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      phone: data.phone?.trim() || null,
      isActive: data.isActive ?? true,
    })
  }

  /**
   * Edita los datos de una sucursal existente.
   */
  async updateLocation(
    id: string,
    organizationId: string,
    data: UpdateLocationInput,
    isSuperAdmin?: boolean
  ): Promise<LocationDTO> {
    // Validar pertenencia a la organización o acceso global SUPERADMIN
    await this.getLocationById(id, organizationId, isSuperAdmin)

    if (data.name !== undefined && !data.name.trim()) {
      throw new ValidationError('El nombre de la sucursal no puede estar vacío.')
    }

    return this.locationRepo.update(id, {
      name: data.name?.trim(),
      type: data.type,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      phone: data.phone?.trim() || null,
      isActive: data.isActive,
    })
  }

  /**
   * Activa o desactiva una sucursal conservando todo su historial.
   */
  async toggleLocationActive(
    id: string,
    organizationId: string,
    isActive: boolean,
    isSuperAdmin?: boolean
  ): Promise<LocationDTO> {
    // Validar pertenencia a la organización o acceso global SUPERADMIN
    await this.getLocationById(id, organizationId, isSuperAdmin)

    return this.locationRepo.toggleActive(id, isActive)
  }
}
