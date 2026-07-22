import { type NextRequest, NextResponse } from 'next/server'
import { changePasswordService } from '@/services'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
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
    console.error('[API.catalog.users.change-password] Error:', err)
    const message =
      err instanceof Error ? err.message : 'Error al cambiar la contraseña del usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
