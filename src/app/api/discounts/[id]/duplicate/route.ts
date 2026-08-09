import { type NextRequest, NextResponse } from 'next/server'
import { duplicateDiscountCreditService } from '@/services'
import { handleRouteError } from '@/lib/api'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import type { ApiResponse, DiscountCredit } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/discounts/[id]/duplicate
export async function POST(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<DiscountCredit>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.manage')

    const { id } = await params
    const duplicated = await duplicateDiscountCreditService.execute(id)

    return NextResponse.json({ data: duplicated }, { status: 201 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al duplicar el beneficio.',
      'POST /api/discounts/[id]/duplicate'
    )
  }
}
