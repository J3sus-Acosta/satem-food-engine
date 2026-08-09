import { type NextRequest, NextResponse } from 'next/server'
import { authenticateUserService } from '@/services'
import { setSessionCookie } from '@/lib/auth-server'
import { TenantResolver } from '@/server/tenant-resolver'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse } from '@/types'

// POST /api/auth/login
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const body = await req.json()
    const { username, password, rememberMe, locationId } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'El nombre de usuario es obligatorio.' }, { status: 400 })
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'La contraseña es obligatoria.' }, { status: 400 })
    }

    // Call authentication domain service
    const user = await authenticateUserService.execute(username, password)

    // Get accessible locations for this user
    const accessibleLocations = await TenantResolver.getAccessibleLocations(user.id)

    if (accessibleLocations.length === 0) {
      return NextResponse.json(
        { error: 'Tu usuario no tiene ninguna sucursal activa asignada.' },
        { status: 403 }
      )
    }

    let selectedLocationId: string | null = null

    if (accessibleLocations.length === 1) {
      // Single location -> automatic login
      selectedLocationId = accessibleLocations[0].id
    } else {
      // Multi-location user
      if (locationId) {
        const matched = accessibleLocations.find((l) => l.id === locationId)
        if (matched) {
          selectedLocationId = matched.id
        }
      }

      if (!selectedLocationId) {
        // Return location selection requirement response
        return NextResponse.json({
          data: {
            requiresLocationSelection: true,
            locations: accessibleLocations,
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
            },
          },
        })
      }
    }

    // Set HttpOnly secure session cookie
    await setSessionCookie(
      {
        userId: user.id,
        organizationId: user.organizationId,
        locationId: selectedLocationId,
        role: user.role,
        username: user.username,
        name: user.name,
      },
      rememberMe !== false
    )

    // Return public user data
    return NextResponse.json({
      data: {
        requiresLocationSelection: false,
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        locationId: selectedLocationId,
        locations: accessibleLocations,
      },
    })
  } catch (error: unknown) {
    return handleRouteError(error, 'Error al iniciar sesión.', 'POST /api/auth/login')
  }
}
