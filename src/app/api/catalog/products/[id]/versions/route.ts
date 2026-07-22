import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse, ProductVersion } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductVersion[]>>> {
  try {
    const { id } = await context.params
    const versions = await productCatalogService.findVersions(id)
    return NextResponse.json({ data: versions })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[GET /api/catalog/products/[id]/versions] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al obtener las versiones del producto' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
