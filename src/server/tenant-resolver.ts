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
}
