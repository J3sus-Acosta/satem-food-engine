import { type NextRequest, NextResponse } from 'next/server'
import { changePasswordService, findUserService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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
    const { password } = body

    if (!password || password.length < 8) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    await changePasswordService.execute(params.id, password)
    return NextResponse.json<ApiResponse<void>>(
      { data: undefined, message: 'Contraseña cambiada con éxito' },
      { status: 200 }
    )
  } catch (err) {
    return handleRouteError(
      err,
      'Error al cambiar la contraseña del usuario.',
      'POST /api/catalog/users/[id]/change-password'
    )
  }
}
