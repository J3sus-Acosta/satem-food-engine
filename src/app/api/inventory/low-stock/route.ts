import { type NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'
import { TenantResolver } from '@/server/tenant-resolver'

/**
 * GET /api/inventory/low-stock
 *
 * Returns a list of inventory items currently below their minimum stock threshold.
 * Consumed by n8n workflow 05 (Low Stock Alert) every hour.
 *
 * Query params:
 *   locationId - The internal location ID to check (optional, defaults to resolved CUID).
 *
 * NOTE: InventoryService.getLowStockAlerts is not yet implemented (returns NotImplementedError).
 * This endpoint returns an empty list safely until the inventory module is completed,
 * preventing the hourly 404 errors in n8n that generate noise in monitoring.
 *
 * When InventoryService is implemented, replace the empty array response with:
 *   const alerts = await inventoryService.getLowStockAlerts(locationId)
 *   return NextResponse.json({ data: alerts })
 */
export async function GET(
  req: NextRequest
): Promise<
  NextResponse<ApiResponse<{ locationId: string; alerts: unknown[]; implementedAt: null | string }>>
> {
  const { searchParams } = new URL(req.url)
  const inputLocation = searchParams.get('locationId') || searchParams.get('locationSlug')
  const resolved = await TenantResolver.resolve(inputLocation)
  const locationId = resolved.locationId

  // TODO: Replace with real implementation once InventoryService.getLowStockAlerts is complete.
  // const alerts = await inventoryService.getLowStockAlerts(locationId)
  return NextResponse.json({
    data: {
      locationId,
      alerts: [],
      implementedAt: null,
    },
  })
}
