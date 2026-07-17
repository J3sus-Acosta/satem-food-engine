import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse, MenuWithCategories } from '@/types'

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<MenuWithCategories>>> {
  try {
    const { searchParams } = new URL(req.url)
    const inputLocation = searchParams.get('locationId') || searchParams.get('slug')
    const resolved = await TenantResolver.resolve(inputLocation)

    const menu = await productService.getMenu(resolved.locationId)

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
