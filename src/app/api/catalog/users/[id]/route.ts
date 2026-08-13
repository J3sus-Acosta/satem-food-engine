import { type NextRequest, NextResponse } from 'next/server'
import { findUserService, updateUserService, deleteUserService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, UserRole } from '@/types'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.view')

    const params = await props.params
    const user = await findUserService.execute(params.id)
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (user.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'No tienes autorización para acceder a un usuario Superadmin.' },
        { status: 403 }
      )
    }

    return NextResponse.json<ApiResponse<typeof user>>({ data: user }, { status: 200 })
  } catch (err) {
    return handleRouteError(
      err,
      'Error al obtener detalles del usuario.',
      'GET /api/catalog/users/[id]'
    )
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.manage')

    const params = await props.params
    const targetUser = await findUserService.execute(params.id)
    if (!targetUser) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'No tienes autorización para modificar a un usuario Superadmin.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, email, role, isActive, assignedLocationId } = body

    if (role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Solo un Superadmin puede asignar el rol Superadmin.' },
        { status: 403 }
      )
    }

    const user = await updateUserService.execute(params.id, {
      name,
      email: email === '' ? null : email,
      role: role as UserRole,
      isActive,
      locationId: assignedLocationId === '' ? null : assignedLocationId,
    })

    return NextResponse.json<ApiResponse<typeof user>>({ data: user }, { status: 200 })
  } catch (err) {
    return handleRouteError(err, 'Error al actualizar el usuario.', 'PUT /api/catalog/users/[id]')
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.manage')

    const params = await props.params
    const targetUser = await findUserService.execute(params.id)
    if (!targetUser) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'No tienes autorización para eliminar a un usuario Superadmin.' },
        { status: 403 }
      )
    }

    await deleteUserService.execute(params.id)
    return NextResponse.json<ApiResponse<void>>(
      { data: undefined, message: 'Usuario eliminado con éxito' },
      { status: 200 }
    )
  } catch (err) {
    return handleRouteError(err, 'Error al eliminar el usuario.', 'DELETE /api/catalog/users/[id]')
  }
}
