import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import type { ApiResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { openingBalance, registerName, locationId, operatorEmail } = body

    if (openingBalance === undefined || openingBalance === null) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El saldo inicial de apertura es obligatorio.' },
        { status: 400 }
      )
    }

    const resolved = await TenantResolver.resolve(locationId)

    // Resolve operator User
    const email = operatorEmail || 'cajero@satem.cl'
    const user = await db.user.findFirst({ where: { email, deletedAt: null } })
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { error: `No se encontró el operador con email "${email}".` },
        { status: 404 }
      )
    }

    const session = await cashService.openSession(
      resolved.organizationId,
      resolved.locationId,
      user.id,
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
