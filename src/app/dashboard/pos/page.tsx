import React from 'react'
import { productService, cashService, listDiscountCreditsService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { requireAuth } from '@/lib/auth-server'
import { hasPermission } from '@/lib/permissions'
import { UnauthorizedPage } from '@/components/layout/UnauthorizedPage'
import type { UserRole } from '@/types'
import { PosBoard } from '@/components/pos/PosBoard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function PosDashboardPage(props: PageProps) {
  const session = await requireAuth()
  const role = session.role as UserRole

  if (!hasPermission(role, 'pos.sell')) {
    return <UnauthorizedPage activeTab="pos" currentUserRole={session.role} />
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

  const menu = await productService.getMenu(locationId)
  const activeCashSession = await cashService.getCurrentSession(locationId, session.userId)
  const hasOpenCashSession = Boolean(activeCashSession)
  const canManageCash = hasPermission(role, 'cash.view')

  const activeDiscounts = await listDiscountCreditsService.execute({
    organizationId: session.organizationId,
    locationId,
    isActive: true,
  })

  return (
    <PosBoard
      menu={menu}
      locationId={locationId}
      organizationId={session.organizationId}
      cashierUserId={session.userId}
      cashierUserName={session.name || session.username || 'Cajero'}
      initialDiscounts={activeDiscounts}
      hasOpenCashSession={hasOpenCashSession}
      canManageCash={canManageCash}
      currentUserRole={session.role}
    />
  )
}
