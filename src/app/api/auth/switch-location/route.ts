import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth, setSessionCookie } from '@/lib/auth-server'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { locationId } = body

    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El ID de la sucursal es obligatorio.' },
        { status: 400 }
      )
    }

    // Verify user access to target location
    const accessibleLocations = await TenantResolver.getAccessibleLocations(session.userId)
    const validLocation = accessibleLocations.find((l) => l.id === locationId)

    if (!validLocation) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'No tienes acceso a la sucursal seleccionada.' },
        { status: 403 }
      )
    }

    // Update active session cookie with new locationId
    await setSessionCookie({
      userId: session.userId,
      organizationId: session.organizationId,
      locationId: validLocation.id,
      role: session.role,
      username: session.username,
      name: session.name,
    })

    return NextResponse.json<ApiResponse<{ locationId: string; locationName: string }>>({
      data: {
        locationId: validLocation.id,
        locationName: validLocation.name,
      },
    })
  } catch (err) {
    console.error('[API.auth.switch-location] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al cambiar de sucursal.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
