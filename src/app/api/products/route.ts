import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse, Product } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Product[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const orgIdOrSlug = searchParams.get('organizationId') || searchParams.get('organizationSlug')
    const organizationId = await TenantResolver.resolveOrganization(orgIdOrSlug)

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
