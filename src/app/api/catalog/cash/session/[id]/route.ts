import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const { id } = params
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El ID de la sesión es requerido.' },
        { status: 400 }
      )
    }

    const session = await cashService.getSession(id)
    return NextResponse.json<ApiResponse<typeof session>>({ data: session }, { status: 200 })
  } catch (err) {
    console.error('[API.cash.session.details] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al obtener detalles del turno.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
