import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import type { ApiResponse, Category } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Category[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    let menuId = searchParams.get('menuId')

    if (!menuId) {
      const defaultMenu = await productService.getMenu(TENANT_CONFIG.defaultLocationSlug)
      menuId = defaultMenu.id
    }

    const categories = await productService.getCategories(menuId)
    return NextResponse.json({ data: categories })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/categories] Error fetching categories:', err)
    return NextResponse.json(
      { error: err.message || 'Error al cargar las categorías' },
      { status: 500 }
    )
  }
}
