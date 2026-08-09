import { type NextRequest, NextResponse } from 'next/server'
import { listDiscountCreditsService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, DiscountCredit } from '@/types'

// GET /api/discounts/active?locationId=...
// Returns active discounts/credits for the POS selector.
// Includes org-wide (locationId=null) and location-specific records.
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<DiscountCredit[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationIdParam = searchParams.get('locationId')
    const sanitizedLocId =
      locationIdParam && locationIdParam !== 'undefined' ? locationIdParam : undefined

    const resolved = await TenantResolver.resolve(sanitizedLocId)

    const list = await listDiscountCreditsService.execute({
      organizationId: resolved.organizationId,
      locationId: resolved.locationId,
      isActive: true,
    })

    return NextResponse.json({ data: list })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al obtener los beneficios activos.',
      'GET /api/discounts/active'
    )
  }
}
