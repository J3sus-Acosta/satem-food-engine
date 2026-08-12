import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { customReportService } from '@/services'
import type { ApiResponse, SalesReportQueryFilters, SalesReportQueryResult } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const body: SalesReportQueryFilters = await req.json()
    const targetLocationId = body.locationId || session.locationId || undefined

    const reportResult = await customReportService.getSalesDetailReport(
      session.organizationId,
      targetLocationId,
      body
    )

    return NextResponse.json<ApiResponse<SalesReportQueryResult>>({
      data: reportResult,
    })
  } catch (error: unknown) {
    console.error('[POST /api/reports/sales-detail] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al obtener reporte de ventas.' },
      { status: statusCode }
    )
  }
}
