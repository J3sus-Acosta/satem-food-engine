import 'server-only'

import { db } from './db'
import { NotFoundError } from '@/lib/errors'

export interface ResolvedLocation {
  locationId: string
  organizationId: string
}

export class TenantResolver {
  /**
   * Resolves the locationId and organizationId based on:
   * 1. A valid locationId (CUID)
   * 2. A location slug
   * 3. Fallback to default organization's first location
   */
  static async resolve(locationIdOrSlug?: string | null): Promise<ResolvedLocation> {
    if (locationIdOrSlug) {
      // 1. Check if locationIdOrSlug is a valid location CUID in DB
      const locById = await db.location.findFirst({
        where: { id: locationIdOrSlug, isActive: true, deletedAt: null },
      })
      if (locById) {
        return {
          locationId: locById.id,
          organizationId: locById.organizationId,
        }
      }

      // 2. Check if it corresponds to a location slug
      const locBySlug = await db.location.findFirst({
        where: { slug: locationIdOrSlug, isActive: true, deletedAt: null },
      })
      if (locBySlug) {
        return {
          locationId: locBySlug.id,
          organizationId: locBySlug.organizationId,
        }
      }
    }

    // 3. Fallback: Find the first active organization
    const org = await db.organization.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })

    if (!org) {
      throw new NotFoundError('Organization', 'active')
    }

    // 4 & 5. Find the first active location of this organization
    const loc = await db.location.findFirst({
      where: { organizationId: org.id, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })

    if (!loc) {
      throw new NotFoundError('Location', 'any active')
    }

    return {
      locationId: loc.id,
      organizationId: org.id,
    }
  }

  /**
   * Resolves organization ID based on:
   * 1. A valid organization ID (CUID)
   * 2. An organization slug
   * 3. Fallback to the first active organization
   */
  static async resolveOrganization(orgIdOrSlug?: string | null): Promise<string> {
    if (orgIdOrSlug) {
      const orgById = await db.organization.findFirst({
        where: { id: orgIdOrSlug, isActive: true, deletedAt: null },
      })
      if (orgById) return orgById.id

      const orgBySlug = await db.organization.findFirst({
        where: { slug: orgIdOrSlug, isActive: true, deletedAt: null },
      })
      if (orgBySlug) return orgBySlug.id
    }

    const org = await db.organization.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })

    if (!org) {
      throw new NotFoundError('Organization', 'active')
    }

    return org.id
  }

  /**
   * Retrieves all active locations accessible by a specific user.
   * If the user is assigned a specific locationId and has no UserLocation overrides, returns that location.
   * If the user has explicit UserLocation entries, returns those locations.
   * If locationId is null and no UserLocation overrides exist, returns all active locations of their organization.
   */
  static async getAccessibleLocations(
    userId: string
  ): Promise<Array<{ id: string; name: string; slug: string }>> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userLocations: {
          include: { location: true },
        },
      },
    })

    if (!user || !user.isActive || user.deletedAt) {
      return []
    }

    // 0. SUPERADMIN has global access to all locations
    if (user.role === 'SUPERADMIN') {
      const allLocations = await db.location.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      })
      return allLocations
    }

    // 1. Check explicit UserLocation table mappings
    const grantedLocations = user.userLocations
      .map((ul) => ul.location)
      .filter((loc) => loc && loc.isActive && !loc.deletedAt)

    if (grantedLocations.length > 0) {
      return grantedLocations.map((l) => ({ id: l.id, name: l.name, slug: l.slug }))
    }

    // 2. Check user's direct single locationId assignment
    if (user.locationId) {
      const loc = await db.location.findFirst({
        where: { id: user.locationId, isActive: true, deletedAt: null },
      })
      if (loc) {
        return [{ id: loc.id, name: loc.name, slug: loc.slug }]
      }
    }

    // 3. Fallback for multi-branch users (locationId === null): return all active locations in organization
    const orgLocations = await db.location.findMany({
      where: { organizationId: user.organizationId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    })

    return orgLocations
  }
}
