import type { LocationDTO, CreateLocationInput, UpdateLocationInput } from '@/types'

export interface ILocationRepository {
  /**
   * Retrieves all locations belonging to an organization, or all locations if organizationId is omitted.
   */
  findByOrganization(organizationId?: string): Promise<LocationDTO[]>

  /**
   * Retrieves a location by its ID.
   */
  findById(id: string): Promise<LocationDTO | null>

  /**
   * Retrieves a location by organization ID and slug.
   */
  findBySlug(organizationId: string, slug: string): Promise<LocationDTO | null>

  /**
   * Creates a new location in the organization.
   */
  create(data: CreateLocationInput): Promise<LocationDTO>

  /**
   * Updates an existing location.
   */
  update(id: string, data: UpdateLocationInput): Promise<LocationDTO>

  /**
   * Toggles the isActive status of a location.
   */
  toggleActive(id: string, isActive: boolean): Promise<LocationDTO>
}
