/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { productCatalogService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse, ProductWithFull, ProductCatalogListFilters } from '@/types'

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ products: ProductWithFull[]; pagination: any }>>> {
  try {
    const { searchParams } = new URL(req.url)
    const orgIdOrSlug = searchParams.get('organizationId') || searchParams.get('organizationSlug')
    const organizationId = await TenantResolver.resolveOrganization(orgIdOrSlug)

    // Parse filters
    const filters: ProductCatalogListFilters = {
      status: (searchParams.get('status') as any) || 'all',
      hasImage: (searchParams.get('hasImage') as any) || 'all',
      hasVariants: (searchParams.get('hasVariants') as any) || 'all',
      hasModifiers: (searchParams.get('hasModifiers') as any) || 'all',
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))

    const { products, total } = await productCatalogService.findProducts(
      organizationId,
      filters,
      page,
      limit
    )

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/catalog/products] Error fetching catalog products:', err)
    return NextResponse.json(
      { error: err.message || 'Error al obtener el catálogo de productos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ProductWithFull>>> {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const orgIdOrSlug = searchParams.get('organizationId') || searchParams.get('organizationSlug')
    const organizationId = await TenantResolver.resolveOrganization(orgIdOrSlug)

    const product = await productCatalogService.createProduct({
      ...body,
      organizationId,
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const isValidation =
      err.name === 'ValidationError' ||
      err.message.includes('obligatorio') ||
      err.message.includes('ya está en uso')
    console.error('[POST /api/catalog/products] Error creating catalog product:', err)
    return NextResponse.json(
      { error: err.message || 'Error al crear el producto' },
      { status: isValidation ? 400 : 500 }
    )
  }
}
