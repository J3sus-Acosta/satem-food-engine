import { type NextRequest, NextResponse } from 'next/server'
import { reportingService, cashService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const sessionId = searchParams.get('sessionId') || undefined
    const startStr = searchParams.get('startDate') || undefined
    const endStr = searchParams.get('endDate') || undefined
    const userId = searchParams.get('userId') || undefined
    const channel = searchParams.get('channel') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const orderStatus = searchParams.get('orderStatus') || undefined
    const operatorEmail = searchParams.get('operatorEmail') || 'cajero@satem.cl'

    const resolved = await TenantResolver.resolve(locationId)

    // Log the action to CashAudit if a session is present
    const user = await db.user.findFirst({ where: { email: operatorEmail, deletedAt: null } })
    if (user && sessionId) {
      await cashService.logReportAction(
        resolved.organizationId,
        resolved.locationId,
        user.id,
        sessionId,
        'PRINT_REPORT',
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      )
    }

    // Resolve date bounds
    let startDate = startStr ? new Date(startStr) : undefined
    let endDate = endStr ? new Date(endStr) : undefined

    // If a session ID is provided, query using the session opened/closed bounds!
    if (sessionId) {
      const session = await cashService.getSession(sessionId)
      if (session) {
        startDate = session.openedAt
        endDate = session.closedAt || new Date()
      }
    }

    const report = await reportingService.generateReport({
      organizationId: resolved.organizationId,
      locationId: resolved.locationId,
      sessionId,
      startDate,
      endDate,
      userId,
      channel,
      paymentMethod,
      orderStatus,
    })

    return NextResponse.json<ApiResponse<typeof report>>({ data: report }, { status: 200 })
  } catch (err) {
    console.error('[API.cash.report] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al generar reporte de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
