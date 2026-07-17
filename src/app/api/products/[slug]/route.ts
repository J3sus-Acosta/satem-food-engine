import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import type { ApiResponse, ProductWithFull } from '@/types'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const { slug } = await context.params
    const { searchParams } = new URL(req.url)
    const organizationId =
      searchParams.get('organizationId') || TENANT_CONFIG.defaultOrganizationSlug

    const product = await productService.getProductBySlug(organizationId, slug)
    return NextResponse.json({ data: product })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(
      `[GET /api/products/[slug]] Error fetching product by slug "${err.message}":`,
      err
    )
    return NextResponse.json(
      { error: err.message || 'Error al cargar el detalle del producto' },
      { status: err.name === 'NotFoundError' ? 404 : 500 }
    )
  }
}
