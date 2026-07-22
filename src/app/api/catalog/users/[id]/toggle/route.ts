import { type NextRequest, NextResponse } from 'next/server'
import { enableUserService, disableUserService, findUserService } from '@/services'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const user = await findUserService.execute(params.id)
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado' },
        { status: 404 }
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
    console.error('[API.catalog.users.toggle] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al alternar estado del usuario.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
