import React from 'react'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole } from '@/types'
import { db } from '@/server/db'
import CashDashboardClient from './CashDashboardClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardCashPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'cash.view')) {
    return <UnauthorizedPage activeTab="cash" currentUserRole={session.role} />
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

  const users = await db.user.findMany({
    where: {
      organizationId,
      deletedAt: null,
      isActive: true,
      ...(session.role === 'SUPERADMIN' ? {} : { role: { not: 'SUPERADMIN' } }),
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  })

  // Get active channels for filters
  const channels = await db.channel.findMany({
    where: { locationId: activeLocationId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  const currentUserRecord = await db.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })

  return (
    <CashDashboardClient
      organizationId={organizationId}
      locationId={activeLocationId}
      locations={locations}
      users={users}
      channels={channels}
      currentUserSession={{
        userId: session.userId,
        name: session.name,
        username: session.username,
        email: currentUserRecord?.email || session.username,
        role: session.role,
      }}
    />
  )
}
