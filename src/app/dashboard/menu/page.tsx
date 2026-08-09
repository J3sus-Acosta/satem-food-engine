import React from 'react'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole } from '@/types'
import MenuDashboardClient from './MenuDashboardClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardMenuPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'catalog.manage')) {
    return <UnauthorizedPage activeTab="menu" currentUserRole={session.role} />
  }

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

  let initialMenu = null
  let errorMsg = null

  try {
    initialMenu = await productService.getMenu(locationId, true)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[DashboardMenuPage] Error loading menu:', error)
    errorMsg = error.message || 'Error desconocido al cargar el menú'
  }

  return (
    <MenuDashboardClient
      initialMenu={initialMenu}
      locationId={locationId}
      errorMsg={errorMsg}
      currentUserRole={session.role}
    />
  )
}
