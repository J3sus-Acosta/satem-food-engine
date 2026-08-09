import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import { db } from '@/server/db'
import { requireAuth } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const authSession = await requireAuth()
    const body = await req.json()
    const { sessionId, amount, type, reason, operatorEmail, operatorUserId } = body

    if (!sessionId) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El ID de la sesión de caja es obligatorio.' },
        { status: 400 }
      )
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El monto debe ser mayor a cero.' },
        { status: 400 }
      )
    }

    if (type !== 'IN' && type !== 'OUT') {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El tipo de movimiento debe ser IN o OUT.' },
        { status: 400 }
      )
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El motivo es obligatorio.' },
        { status: 400 }
      )
    }

    let targetUserId = authSession.userId
    if (operatorUserId) {
      const user = await db.user.findFirst({ where: { id: operatorUserId, deletedAt: null } })
      if (user) targetUserId = user.id
    } else if (operatorEmail) {
      const user = await db.user.findFirst({
        where: {
          OR: [{ email: operatorEmail }, { username: operatorEmail }],
          deletedAt: null,
        },
      })
      if (user) targetUserId = user.id
    }

    const movement = await cashService.addMovement(
      sessionId,
      Number(amount),
      type,
      reason,
      targetUserId,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    )

    return NextResponse.json<ApiResponse<typeof movement>>({ data: movement }, { status: 201 })
  } catch (err) {
    console.error('[API.cash.session.movement] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al agregar movimiento de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
