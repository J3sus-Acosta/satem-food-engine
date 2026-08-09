import { type NextRequest, NextResponse } from 'next/server'
import { enableDiscountCreditService } from '@/services'
import { handleRouteError } from '@/lib/api'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import type { ApiResponse, DiscountCredit } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/discounts/[id]/enable
export async function PATCH(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<DiscountCredit>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.manage')

    const { id } = await params
    const dc = await enableDiscountCreditService.execute(id)
    return NextResponse.json({ data: dc })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al activar el beneficio.',
      'PATCH /api/discounts/[id]/enable'
    )
  }
}
