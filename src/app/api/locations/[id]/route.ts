import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { locationService } from '@/services'
import { ForbiddenError } from '@/lib/errors'
import type { ApiResponse, LocationDTO, UpdateLocationInput } from '@/types'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'locations.manage')

    const isSuperAdmin = session.role === 'SUPERADMIN'
    const params = await props.params
    const body: UpdateLocationInput = await req.json()

    const updated = await locationService.updateLocation(
      params.id,
      session.organizationId,
      body,
      isSuperAdmin
    )

    return NextResponse.json<ApiResponse<LocationDTO>>({ data: updated })
  } catch (error: unknown) {
    console.error('[PUT /api/locations/[id]] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode =
      error instanceof ForbiddenError || (error as { status?: number }).status === 403
        ? 403
        : (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al actualizar la sucursal.' },
      { status: statusCode }
    )
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'locations.manage')

    const isSuperAdmin = session.role === 'SUPERADMIN'
    const params = await props.params
    const body: { isActive?: boolean } = await req.json()

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El campo isActive (boolean) es obligatorio.' },
        { status: 400 }
      )
    }

    const updated = await locationService.toggleLocationActive(
      params.id,
      session.organizationId,
      body.isActive,
      isSuperAdmin
    )

    return NextResponse.json<ApiResponse<LocationDTO>>({ data: updated })
  } catch (error: unknown) {
    console.error('[PATCH /api/locations/[id]] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode =
      error instanceof ForbiddenError || (error as { status?: number }).status === 403
        ? 403
        : (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al cambiar estado de la sucursal.' },
      { status: statusCode }
    )
  }
}
