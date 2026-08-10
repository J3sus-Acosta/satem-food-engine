import { type NextRequest, NextResponse } from 'next/server'
import { orderVoidService } from '@/services'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse } from '@/types'

export async function POST(
  req: NextRequest
): Promise<
  NextResponse<ApiResponse<{ id: string; name: string; username: string; role: string }>>
> {
  try {
    const body = await req.json()
    const { organizationId, usernameOrEmail, passwordInput } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'El parámetro "organizationId" es requerido.' },
        { status: 400 }
      )
    }

    const adminUser = await orderVoidService.validateAdminAuthorization(
      organizationId,
      usernameOrEmail,
      passwordInput
    )

    return NextResponse.json({ data: adminUser }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al validar autorización de administrador',
      'POST /api/pos/orders/void/authorize'
    )
  }
}
