import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse, ProductWithFull } from '@/types'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const { id } = await context.params
    const duplicated = await productCatalogService.duplicateProduct(id)
    return NextResponse.json({ data: duplicated }, { status: 201 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[POST /api/catalog/products/[id]/duplicate] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al duplicar el producto' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
