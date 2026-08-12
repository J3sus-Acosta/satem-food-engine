import 'server-only'

import { db } from '@/server/db'
import type { Location } from '@/generated/prisma'
import type { ILocationRepository } from '../interfaces/ILocationRepository'
import type { LocationDTO, CreateLocationInput, UpdateLocationInput, LocationType } from '@/types'

export class PrismaLocationRepository implements ILocationRepository {
  async findByOrganization(organizationId?: string): Promise<LocationDTO[]> {
    const where: Record<string, unknown> = { deletedAt: null }
    if (organizationId) {
      where.organizationId = organizationId
    }

    const locations = await db.location.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })

    return locations.map((loc) => this.mapToDTO(loc))
  }

  async findById(id: string): Promise<LocationDTO | null> {
    const loc = await db.location.findFirst({
      where: { id, deletedAt: null },
    })

    if (!loc) return null
    return this.mapToDTO(loc)
  }

  async findBySlug(organizationId: string, slug: string): Promise<LocationDTO | null> {
    const loc = await db.location.findFirst({
      where: { organizationId, slug, deletedAt: null },
    })

    if (!loc) return null
    return this.mapToDTO(loc)
  }

  async create(data: CreateLocationInput): Promise<LocationDTO> {
    const slug = this.generateSlug(data.name)

    const loc = await db.location.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        type: data.type || 'RESTAURANT',
        slug,
        address: data.address || null,
        city: data.city || null,
        phone: data.phone || null,
        isActive: data.isActive ?? true,
      },
    })

    return this.mapToDTO(loc)
  }

  async update(id: string, data: UpdateLocationInput): Promise<LocationDTO> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) {
      updateData.name = data.name
      updateData.slug = this.generateSlug(data.name)
    }
    if (data.type !== undefined) updateData.type = data.type
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const loc = await db.location.update({
      where: { id },
      data: updateData,
    })

    return this.mapToDTO(loc)
  }

  async toggleActive(id: string, isActive: boolean): Promise<LocationDTO> {
    const loc = await db.location.update({
      where: { id },
      data: { isActive },
    })

    return this.mapToDTO(loc)
  }

  private mapToDTO(loc: Location): LocationDTO {
    return {
      id: loc.id,
      organizationId: loc.organizationId,
      name: loc.name,
      type: loc.type as LocationType,
      slug: loc.slug,
      address: loc.address,
      city: loc.city,
      country: loc.country,
      timezone: loc.timezone,
      phone: loc.phone,
      currency: loc.currency,
      taxRate: Number(loc.taxRate),
      isActive: loc.isActive,
      operatingHours: (loc.operatingHours as Record<string, unknown>) || {},
      settings: (loc.settings as Record<string, unknown>) || {},
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
      deletedAt: loc.deletedAt,
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
