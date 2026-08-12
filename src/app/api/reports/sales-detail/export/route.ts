import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { customReportService } from '@/services'
import type { SalesReportQueryFilters, SalesDetailReportColumnKey } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const body: {
      filters: SalesReportQueryFilters
      visibleColumns: SalesDetailReportColumnKey[]
    } = await req.json()

    const targetLocationId = body.filters?.locationId || session.locationId || undefined

    const excelBuffer = await customReportService.generateSalesDetailExcelBuffer(
      session.organizationId,
      targetLocationId,
      body.filters || {},
      body.visibleColumns || []
    )

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `SATEM_Reporte_Ventas_${dateStr}.xlsx`

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error: unknown) {
    console.error('[POST /api/reports/sales-detail/export] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json(
      { error: err.message || 'Error al generar archivo Excel de ventas.' },
      { status: statusCode }
    )
  }
}
