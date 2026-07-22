import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, closingBalance, observations } = body

    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El ID de la sesión de caja es obligatorio.' },
        { status: 400 }
      )
    }

    if (closingBalance === undefined || closingBalance === null) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El balance de cierre contado es obligatorio.' },
        { status: 400 }
      )
    }

    const session = await cashService.closeSession(
      sessionId,
      Number(closingBalance),
      observations,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    )

    return NextResponse.json<ApiResponse<typeof session>>({ data: session }, { status: 200 })
  } catch (err) {
    console.error('[API.cash.session.close] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al cerrar turno de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
