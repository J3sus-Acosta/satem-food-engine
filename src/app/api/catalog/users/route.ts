import { type NextRequest, NextResponse } from 'next/server'
import { TenantResolver } from '@/server/tenant-resolver'
import { listUsersService, createUserService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, UserRole } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.view')

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId') || undefined
    const search = searchParams.get('search') || undefined
    const role = (searchParams.get('role') || undefined) as UserRole | undefined
    const activeStr = searchParams.get('isActive')
    const isActive = activeStr === 'true' ? true : activeStr === 'false' ? false : undefined

    const resolved = await TenantResolver.resolve(locationId)
    const isSuperAdminCaller = session.role === 'SUPERADMIN'
    const targetOrgId = isSuperAdminCaller ? undefined : resolved.organizationId

    const users = await listUsersService.execute(targetOrgId, {
      search,
      role,
      isActive,
      locationId: searchParams.get('filterLocationId') || undefined,
      excludeSuperAdmin: !isSuperAdminCaller,
    })

    return NextResponse.json<ApiResponse<typeof users>>({ data: users }, { status: 200 })
  } catch (err) {
    return handleRouteError(err, 'Error al obtener listado de usuarios.', 'GET /api/catalog/users')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.manage')

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId') || undefined

    const body = await req.json()
    const { name, username, email, password, role, isActive, assignedLocationId } = body

    if (role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'No tienes autorización para asignar o crear usuarios con el rol Superadmin.' },
        { status: 403 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }
    if (!username || !username.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El nombre de usuario es obligatorio' },
        { status: 400 }
      )
    }
    if (!password || password.length < 8) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }
    if (!role) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El rol es obligatorio' },
        { status: 400 }
      )
    }

    const resolved = await TenantResolver.resolve(locationId)

    const user = await createUserService.execute({
      organizationId: resolved.organizationId,
      locationId: assignedLocationId || null,
      name,
      username,
      email: email || null,
      passwordHash: password,
      role: role as UserRole,
      isActive: isActive ?? true,
    })

    return NextResponse.json<ApiResponse<typeof user>>({ data: user }, { status: 201 })
  } catch (err) {
    return handleRouteError(err, 'Error al crear el usuario.', 'POST /api/catalog/users')
  }
}
