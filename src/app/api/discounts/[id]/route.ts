import { type NextRequest, NextResponse } from 'next/server'
import {
  findDiscountCreditService,
  updateDiscountCreditService,
  deleteDiscountCreditService,
} from '@/services'
import { handleRouteError } from '@/lib/api'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import type {
  ApiResponse,
  DiscountCredit,
  DiscountCreditType,
  DiscountCreditValueType,
} from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/discounts/[id]
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<DiscountCredit>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.view')

    const { id } = await params
    const dc = await findDiscountCreditService.execute(id)
    return NextResponse.json({ data: dc })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al obtener el beneficio.', 'GET /api/discounts/[id]')
  }
}

// PATCH /api/discounts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<DiscountCredit>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.manage')

    const { id } = await params
    const body = await req.json()
    const { name, description, type, valueType, locationId, value, isActive } = body

    const updated = await updateDiscountCreditService.execute(id, {
      name,
      description: description === undefined ? undefined : (description ?? null),
      type: type as DiscountCreditType | undefined,
      valueType: valueType as DiscountCreditValueType | undefined,
      locationId: locationId === undefined ? undefined : (locationId ?? null),
      value: value !== undefined ? Number(value) : undefined,
      isActive,
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al actualizar el beneficio.', 'PATCH /api/discounts/[id]')
  }
}

// DELETE /api/discounts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.manage')

    const { id } = await params
    await deleteDiscountCreditService.execute(id)

    return NextResponse.json({ data: { success: true } })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al eliminar el beneficio.', 'DELETE /api/discounts/[id]')
  }
}
