import { type NextRequest, NextResponse } from 'next/server'
import { TenantResolver } from '@/server/tenant-resolver'
import { listUsersService, createUserService } from '@/services'
import type { ApiResponse, UserRole } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId') || undefined
    const search = searchParams.get('search') || undefined
    const role = (searchParams.get('role') || undefined) as UserRole | undefined
    const activeStr = searchParams.get('isActive')
    const isActive = activeStr === 'true' ? true : activeStr === 'false' ? false : undefined

    const resolved = await TenantResolver.resolve(locationId)

    const users = await listUsersService.execute(resolved.organizationId, {
      search,
      role,
      isActive,
      locationId: searchParams.get('filterLocationId') || undefined,
    })

    return NextResponse.json<ApiResponse<typeof users>>({ data: users }, { status: 200 })
  } catch (err) {
    console.error('[API.catalog.users.list] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al obtener listado de usuarios.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId') || undefined

    const body = await req.json()
    const { name, username, email, password, role, isActive, assignedLocationId } = body

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
    console.error('[API.catalog.users.create] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al crear el usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
