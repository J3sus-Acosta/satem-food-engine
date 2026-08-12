import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { customReportService } from '@/services'
import type { ApiResponse, ReportTemplateDTO } from '@/types'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const params = await props.params
    const body = await req.json()

    const updated = await customReportService.updateTemplate(params.id, body)

    return NextResponse.json<ApiResponse<ReportTemplateDTO>>({ data: updated })
  } catch (error: unknown) {
    console.error('[PUT /api/reports/templates/[id]] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al actualizar plantilla.' },
      { status: statusCode }
    )
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const params = await props.params
    await customReportService.deleteTemplate(params.id)

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
    })
  } catch (error: unknown) {
    console.error('[DELETE /api/reports/templates/[id]] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al eliminar plantilla.' },
      { status: statusCode }
    )
  }
}
