import { type NextRequest, NextResponse } from 'next/server'
import { listDiscountCreditsService, createDiscountCreditService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { handleRouteError } from '@/lib/api'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import type {
  ApiResponse,
  DiscountCredit,
  DiscountCreditType,
  DiscountCreditValueType,
} from '@/types'

// GET /api/discounts?locationId=...&type=...&isActive=...&search=...
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<DiscountCredit[]>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.view')

    const { searchParams } = new URL(req.url)
    const locationIdParam = searchParams.get('locationId')
    const type = searchParams.get('type') as DiscountCreditType | null
    const isActiveParam = searchParams.get('isActive')
    const search = searchParams.get('search') ?? undefined

    const resolved = await TenantResolver.resolve(locationIdParam ?? undefined)

    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined

    const list = await listDiscountCreditsService.execute({
      organizationId: resolved.organizationId,
      type: type ?? undefined,
      isActive,
      search,
    })

    return NextResponse.json({ data: list })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al listar beneficios.', 'GET /api/discounts')
  }
}

// POST /api/discounts
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<DiscountCredit>>> {
  try {
    const session = await requireAuth()
    requirePermission(session, 'discounts.manage')

    const body = await req.json()
    const { locationId, name, description, type, valueType, value, isActive } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'El campo "name" es obligatorio.' }, { status: 400 })
    }
    if (!type) {
      return NextResponse.json({ error: 'El campo "type" es obligatorio.' }, { status: 400 })
    }
    if (!valueType) {
      return NextResponse.json({ error: 'El campo "valueType" es obligatorio.' }, { status: 400 })
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'El campo "value" es obligatorio.' }, { status: 400 })
    }

    const resolved = await TenantResolver.resolve(locationId ?? undefined)

    const created = await createDiscountCreditService.execute({
      organizationId: resolved.organizationId,
      locationId: locationId ?? null,
      name,
      description: description ?? null,
      type: type as DiscountCreditType,
      valueType: valueType as DiscountCreditValueType,
      value: Number(value),
      isActive: isActive !== false,
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al crear el beneficio.', 'POST /api/discounts')
  }
}
