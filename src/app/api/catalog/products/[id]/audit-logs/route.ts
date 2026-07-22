import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse, CatalogAuditLog } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CatalogAuditLog[]>>> {
  try {
    const { id } = await context.params
    const logs = await productCatalogService.findAuditLogs(id)
    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[GET /api/catalog/products/[id]/audit-logs] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al obtener los logs de auditoría' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
