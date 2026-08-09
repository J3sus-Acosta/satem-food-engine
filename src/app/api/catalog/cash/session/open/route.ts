import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import { requireAuth } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const authSession = await requireAuth()
    const body = await req.json()
    const { openingBalance, registerName, locationId, operatorEmail, operatorUserId } = body

    if (openingBalance === undefined || openingBalance === null) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El saldo inicial de apertura es obligatorio.' },
        { status: 400 }
      )
    }

    const resolved = await TenantResolver.resolve(locationId)

    // Default to currently logged-in user ID
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

    const session = await cashService.openSession(
      resolved.organizationId,
      resolved.locationId,
      targetUserId,
      Number(openingBalance),
      registerName,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    )

    return NextResponse.json<ApiResponse<typeof session>>({ data: session }, { status: 201 })
  } catch (err) {
    console.error('[API.cash.session.open] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al abrir turno de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
