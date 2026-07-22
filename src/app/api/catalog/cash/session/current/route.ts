import { type NextRequest, NextResponse } from 'next/server'
import { cashService, reportingService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const userEmail = searchParams.get('userEmail') || 'cajero@satem.cl'

    const resolved = await TenantResolver.resolve(locationId)

    const user = await db.user.findFirst({ where: { email: userEmail, deletedAt: null } })
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'Usuario no encontrado.' },
        { status: 404 }
      )
    }

    const session = await cashService.getCurrentSession(resolved.locationId, user.id)

    if (!session) {
      return NextResponse.json<ApiResponse<null>>({ data: null }, { status: 200 })
    }

    // Load detailed summary for the active session dynamically
    const report = await reportingService.generateReport({
      organizationId: session.organizationId,
      locationId: session.locationId,
      startDate: session.openedAt,
      endDate: new Date(),
      userId: session.userId,
    })

    // Load manual movements for the active session
    const movements = await cashService.getSession(session.id).then((s) => s.movements || [])

    return NextResponse.json<ApiResponse<unknown>>(
      {
        data: {
          session,
          report,
          movements,
        },
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[API.cash.session.current] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al obtener sesión de caja activa.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
