import React from 'react'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { locationService } from '@/services'
import { LocationsDashboardClient } from './LocationsDashboardClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Administración de Sucursales | SATEM Food Engine',
  description: 'Gestión y control de sucursales de la plataforma.',
}

export default async function LocationsDashboardPage() {
  const session = await requireAuth()
  requirePermission(session, 'locations.view')

  const isSuperAdmin = session.role === 'SUPERADMIN'
  const initialLocations = await locationService.getLocationsByOrganization(
    session.organizationId,
    isSuperAdmin
  )

  return <LocationsDashboardClient userRole={session.role} initialLocations={initialLocations} />
}
