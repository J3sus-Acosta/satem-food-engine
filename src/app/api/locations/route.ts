import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { locationService } from '@/services'
import { ForbiddenError } from '@/lib/errors'
import type { ApiResponse, LocationDTO, CreateLocationInput } from '@/types'

export async function GET() {
  try {
    const session = await requireAuth()
    requirePermission(session, 'locations.view')

    const isSuperAdmin = session.role === 'SUPERADMIN'
    const locations = await locationService.getLocationsByOrganization(
      session.organizationId,
      isSuperAdmin
    )
    return NextResponse.json<ApiResponse<LocationDTO[]>>({ data: locations })
  } catch (error: unknown) {
    console.error('[GET /api/locations] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode =
      error instanceof ForbiddenError || (error as { status?: number }).status === 403
        ? 403
        : (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al obtener sucursales.' },
      { status: statusCode }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'locations.manage')

    const isSuperAdmin = session.role === 'SUPERADMIN'
    const body: Partial<CreateLocationInput> = await req.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El nombre de la sucursal es obligatorio.' },
        { status: 400 }
      )
    }

    const targetOrgId =
      isSuperAdmin && body.organizationId ? body.organizationId : session.organizationId

    const created = await locationService.createLocation({
      organizationId: targetOrgId,
      name: body.name,
      type: body.type,
      address: body.address,
      city: body.city,
      phone: body.phone,
      isActive: body.isActive ?? true,
    })

    return NextResponse.json<ApiResponse<LocationDTO>>({ data: created }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/locations] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode =
      error instanceof ForbiddenError || (error as { status?: number }).status === 403
        ? 403
        : (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al crear la sucursal.' },
      { status: statusCode }
    )
  }
}
