/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { TenantResolver } from '@/server/tenant-resolver'
import { productCatalogService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole } from '@/types'
import CatalogDashboardClient from './CatalogDashboardClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardCatalogPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'catalog.manage')) {
    return <UnauthorizedPage activeTab="catalog" currentUserRole={session.role} />
  }

  const organizationId = session.organizationId
  const params = await props.searchParams

  // Enforce location lock if user is restricted to a single location.
  // Otherwise, default to parameter or first resolved location.
  let locationId = session.locationId
  if (!locationId) {
    if (params.locationId) {
      locationId = params.locationId
    } else {
      const resolved = await TenantResolver.resolve(null)
      locationId = resolved.locationId
    }
  }

  let categories: { id: string; name: string }[] = []
  let ingredients: any[] = []
  let errorMsg: string | null = null

  try {
    categories = await productCatalogService.getCategories(organizationId)
    ingredients = await productCatalogService.getIngredients(organizationId)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[DashboardCatalogPage] Error loading catalog data:', error)
    errorMsg = error.message || 'Error al cargar los datos del catálogo'
  }

  return (
    <CatalogDashboardClient
      organizationId={organizationId}
      locationId={locationId}
      categories={categories}
      ingredients={ingredients}
      errorMsg={errorMsg}
      currentUserRole={session.role}
    />
  )
}
