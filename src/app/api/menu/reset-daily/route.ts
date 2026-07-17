import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import type { ApiResponse } from '@/types'
import { validateMenuSyncSecret } from '@/services/menu-sync'

/**
 * POST /api/menu/reset-daily
 *
 * Deletes all DailyMenuOverrides for a location's active menu.
 * Called by n8n workflow 04 (Nightly Maintenance) at 02:00 AM to reset
 * daily availability, stock, and pricing before the next Google Sheets sync.
 *
 * Security: Validates the `x-menu-sync-secret` header. If MENU_SYNC_SECRET
 * env variable is not set, the endpoint accepts all requests (development mode).
 * In production, always configure MENU_SYNC_SECRET.
 *
 * Expected body:
 * { "locationId": "<internal locationId from DB>" }
 *
 * Success response (HTTP 200):
 * { "data": { "deletedCount": 5 } }
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ deletedCount: number }>>> {
  // 1. Validate secret
  const receivedSecret = req.headers.get('x-menu-sync-secret')
  if (!validateMenuSyncSecret(receivedSecret)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // 2. Parse and validate body
    const body = await req.json()
    const { locationId } = body as { locationId?: string }

    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json(
        { error: 'locationId es obligatorio y debe ser un string' },
        { status: 400 }
      )
    }

    // 3. Delegate to ProductService
    const deletedCount = await productService.resetDailyOverrides(locationId)

    return NextResponse.json({ data: { deletedCount } })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/menu/reset-daily] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
