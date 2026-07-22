import React from 'react'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import UserDashboardClient from './UserDashboardClient'

export const metadata = {
  title: 'Gestión de Usuarios',
  description: 'SATEM Food Engine - Administración de Personal y Accesos',
}

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardUsersPage(props: PageProps) {
  const params = await props.searchParams
  const resolved = await TenantResolver.resolve(params.locationId)
  const organizationId = resolved.organizationId
  const locationId = resolved.locationId

  // Fetch locations for assignment dropdown
  const locations = await db.location.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return <UserDashboardClient locationId={locationId} locations={locations} />
}
