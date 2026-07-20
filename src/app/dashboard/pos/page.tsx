import React from 'react'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { PosBoard } from '@/components/pos/PosBoard'

// Opt out of static rendering to ensure fresh menu and location data
export const dynamic = 'force-dynamic'

export default async function PosDashboardPage() {
  const resolved = await TenantResolver.resolve(null)
  const menu = await productService.getMenu(resolved.locationId)

  return <PosBoard menu={menu} />
}
