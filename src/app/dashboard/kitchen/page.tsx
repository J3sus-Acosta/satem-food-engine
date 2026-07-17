import React from 'react'
import { kitchenService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import { KitchenBoard } from '@/components/kitchen/KitchenBoard'
import type { OrderWithItems } from '@/types'

// Opt out of static rendering to ensure fresh orders are served
export const dynamic = 'force-dynamic'

export default async function KitchenDashboardPage() {
  const defaultLocation = TENANT_CONFIG.defaultLocationSlug

  // Fetch initial kitchen orders queue from Server Side
  let initialOrders: OrderWithItems[] = []
  try {
    initialOrders = await kitchenService.getActiveTickets(defaultLocation)
  } catch (err) {
    console.error('[KitchenDashboardPage] Error loading SSR active orders queue:', err)
  }

  // Delegate complete interactivity to the client-side board component
  return <KitchenBoard initialOrders={initialOrders} />
}
