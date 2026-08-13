import { type NextRequest, NextResponse } from 'next/server'
import { enableUserService, disableUserService, findUserService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'users.manage')

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
        { error: 'No tienes autorización para modificar a un usuario Superadmin.' },
        { status: 403 }
      )
    }

    const updatedUser = user.isActive
      ? await disableUserService.execute(params.id)
      : await enableUserService.execute(params.id)

    return NextResponse.json<ApiResponse<typeof updatedUser>>(
      { data: updatedUser },
      { status: 200 }
    )
  } catch (err) {
    return handleRouteError(
      err,
      'Error al alternar estado del usuario.',
      'POST /api/catalog/users/[id]/toggle'
    )
  }
}
