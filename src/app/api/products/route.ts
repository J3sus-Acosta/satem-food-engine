import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import type { ApiResponse, Product } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Product[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId =
      searchParams.get('organizationId') || TENANT_CONFIG.defaultOrganizationSlug

    const products = await productService.getProducts(organizationId)
    return NextResponse.json({ data: products })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/products] Error fetching products:', err)
    return NextResponse.json(
      { error: err.message || 'Error al cargar los productos' },
      { status: 500 }
    )
  }
}
