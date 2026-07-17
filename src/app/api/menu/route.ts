import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import type { ApiResponse, MenuWithCategories } from '@/types'

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<MenuWithCategories>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationIdOrSlug =
      searchParams.get('locationId') ||
      searchParams.get('slug') ||
      TENANT_CONFIG.defaultLocationSlug

    const menu = await productService.getMenu(locationIdOrSlug)

    return NextResponse.json({ data: menu })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/menu] Error fetching menu:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor al cargar el menú' },
      { status: err.name === 'NotFoundError' ? 404 : 500 }
    )
  }
}
