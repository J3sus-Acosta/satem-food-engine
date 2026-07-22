import { type NextRequest, NextResponse } from 'next/server'
import { findUserService, updateUserService, deleteUserService } from '@/services'
import type { ApiResponse, UserRole } from '@/types'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const user = await findUserService.execute(params.id)
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json<ApiResponse<typeof user>>({ data: user }, { status: 200 })
  } catch (err) {
    console.error('[API.catalog.users.detail] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al obtener detalles del usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const body = await req.json()
    const { name, email, role, isActive, assignedLocationId } = body

    const user = await updateUserService.execute(params.id, {
      name,
      email: email === '' ? null : email,
      role: role as UserRole,
      isActive,
      locationId: assignedLocationId === '' ? null : assignedLocationId,
    })

    return NextResponse.json<ApiResponse<typeof user>>({ data: user }, { status: 200 })
  } catch (err) {
    console.error('[API.catalog.users.update] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al actualizar el usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    await deleteUserService.execute(params.id)
    return NextResponse.json<ApiResponse<void>>(
      { data: undefined, message: 'Usuario eliminado con éxito' },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API.catalog.users.delete] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al eliminar el usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
