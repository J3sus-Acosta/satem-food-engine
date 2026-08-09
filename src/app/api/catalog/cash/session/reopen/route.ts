import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import { requireAuth } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const authSession = await requireAuth()
    const body = await req.json()
    const { sessionId, reason } = body

    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El ID de la sesión de caja es obligatorio.' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Debe indicar un motivo de reapertura.' },
        { status: 400 }
      )
    }

    const session = await cashService.reopenSession(
      sessionId,
      authSession.userId,
      reason,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    )

    return NextResponse.json<ApiResponse<typeof session>>({ data: session }, { status: 200 })
  } catch (err) {
    console.error('[API.cash.session.reopen] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al reabrir turno de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
