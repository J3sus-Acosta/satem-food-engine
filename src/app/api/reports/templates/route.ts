import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { customReportService } from '@/services'
import type { ApiResponse, ReportTemplateDTO } from '@/types'

export async function GET() {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const templates = await customReportService.getTemplates(session.organizationId, session.userId)

    return NextResponse.json<ApiResponse<ReportTemplateDTO[]>>({
      data: templates,
    })
  } catch (error: unknown) {
    console.error('[GET /api/reports/templates] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al obtener plantillas.' },
      { status: statusCode }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    requirePermission(session, 'reports.view')

    const body = await req.json()
    if (!body.name || !body.configuration) {
      return NextResponse.json<ApiResponse<never>>(
        { error: 'El nombre y la configuración son requeridos.' },
        { status: 400 }
      )
    }

    const template = await customReportService.createTemplate({
      organizationId: session.organizationId,
      locationId: session.locationId || null,
      userId: session.userId,
      name: body.name,
      description: body.description || null,
      isShared: Boolean(body.isShared),
      configuration: body.configuration,
    })

    return NextResponse.json<ApiResponse<ReportTemplateDTO>>({ data: template }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/reports/templates] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    const statusCode = (error as { status?: number }).status || 500
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al crear plantilla.' },
      { status: statusCode }
    )
  }
}
