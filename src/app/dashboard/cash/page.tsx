import React from 'react'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import CashDashboardClient from './CashDashboardClient'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardCashPage(props: PageProps) {
  const params = await props.searchParams
  const resolved = await TenantResolver.resolve(params.locationId)
  const locationId = resolved.locationId
  const organizationId = resolved.organizationId

  // Fetch locations and users for filters in UI
  const locations = await db.location.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const users = await db.user.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  })

  // Get active channels for filters
  const channels = await db.channel.findMany({
    where: { locationId, isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <CashDashboardClient
      organizationId={organizationId}
      locationId={locationId}
      locations={locations}
      users={users}
      channels={channels}
    />
  )
}
