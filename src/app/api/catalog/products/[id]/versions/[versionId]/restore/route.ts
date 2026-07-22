import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse, ProductWithFull } from '@/types'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; versionId: string }> }
): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const { id, versionId } = await context.params
    const restored = await productCatalogService.restoreProductVersion(id, versionId)
    return NextResponse.json({ data: restored })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    const isValidation = err.name === 'ValidationError'
    console.error(`[POST /api/catalog/products/[id]/versions/[versionId]/restore] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al restaurar la versión del producto' },
      { status: isValidation ? 400 : isNotFound ? 404 : 500 }
    )
  }
}
