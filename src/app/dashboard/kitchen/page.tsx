import React from 'react'
import { kitchenService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole, OrderWithItems } from '@/types'
import { KitchenBoard } from '@/components/kitchen/KitchenBoard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function KitchenDashboardPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'kitchen.view')) {
    return <UnauthorizedPage activeTab="kitchen" currentUserRole={session.role} />
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

  // Fetch initial kitchen orders queue from Server Side
  let initialOrders: OrderWithItems[] = []
  try {
    initialOrders = await kitchenService.getActiveTickets(locationId)
  } catch (err) {
    console.error('[KitchenDashboardPage] Error loading SSR active orders queue:', err)
  }

  // Delegate complete interactivity to the client-side board component
  return <KitchenBoard initialOrders={initialOrders} />
}
