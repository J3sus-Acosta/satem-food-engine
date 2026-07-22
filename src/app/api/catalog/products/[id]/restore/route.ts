import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse } from '@/types'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { id } = await context.params
    await productCatalogService.restoreProduct(id)
    return NextResponse.json({ data: { success: true } })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[POST /api/catalog/products/[id]/restore] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al restaurar el producto' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
