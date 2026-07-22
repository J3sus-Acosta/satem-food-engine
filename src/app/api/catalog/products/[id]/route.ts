import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import type { ApiResponse, ProductWithFull } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const product = await productCatalogService.findProduct(id, includeDeleted)
    return NextResponse.json({ data: product })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[GET /api/catalog/products/[id]] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al obtener el producto' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const { id } = await context.params
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const changeReason = searchParams.get('changeReason')

    const product = await productCatalogService.updateProduct(id, body, null, changeReason)
    return NextResponse.json({ data: product })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isValidation = err.name === 'ValidationError'
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[PUT /api/catalog/products/[id]] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al actualizar el producto' },
      { status: isValidation ? 400 : isNotFound ? 404 : 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { id } = await context.params
    await productCatalogService.deleteProduct(id)
    return NextResponse.json({ data: { success: true } })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isNotFound = err.name === 'NotFoundError'
    console.error(`[DELETE /api/catalog/products/[id]] Error:`, err)
    return NextResponse.json(
      { error: err.message || 'Error al eliminar el producto' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
