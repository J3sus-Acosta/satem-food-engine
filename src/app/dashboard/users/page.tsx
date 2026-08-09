import React from 'react'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole } from '@/types'
import { db } from '@/server/db'
import UserDashboardClient from './UserDashboardClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gestión de Usuarios',
  description: 'SATEM Food Engine - Administración de Personal y Accesos',
}

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardUsersPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'users.view')) {
    return <UnauthorizedPage activeTab="users" currentUserRole={session.role} />
  }

  const organizationId = session.organizationId
  const params = await props.searchParams

  // Enforce location lock if user is restricted to a single location
  const locationId = session.locationId !== null ? session.locationId : params.locationId || ''

  // Fetch locations restricted to user's organization
  const locations = await db.location.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const activeLocationId = locationId || locations[0]?.id || ''

  return (
    <UserDashboardClient
      locationId={activeLocationId}
      locations={locations}
      currentUserRole={session.role}
    />
  )
}
