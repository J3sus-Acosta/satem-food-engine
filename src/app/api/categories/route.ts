import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse, Category } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Category[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    let menuId = searchParams.get('menuId')

    if (!menuId) {
      const resolved = await TenantResolver.resolve(null)
      const defaultMenu = await productService.getMenu(resolved.locationId)
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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Category>>> {
  try {
    const body = await req.json()
    const { name, menuId: reqMenuId, sortOrder } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la categoría es requerido' }, { status: 400 })
    }

    let menuId = reqMenuId
    if (!menuId) {
      const resolved = await TenantResolver.resolve(null)
      const defaultMenu = await productService.getMenu(resolved.locationId)
      menuId = defaultMenu.id
    }

    const { db } = await import('@/server/db')
    const newCategory = await db.category.create({
      data: {
        menuId,
        name: name.trim(),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })

    return NextResponse.json({ data: newCategory as unknown as Category }, { status: 201 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/categories] Error creating category:', err)
    return NextResponse.json(
      { error: err.message || 'Error al crear la categoría' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse<Category>>> {
  try {
    const body = await req.json()
    const { id, name, sortOrder, isActive } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'El ID de la categoría es requerido' }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la categoría es requerido' }, { status: 400 })
    }

    const { db } = await import('@/server/db')
    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(typeof sortOrder === 'number' ? { sortOrder } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    })

    return NextResponse.json({ data: updatedCategory as unknown as Category })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[PUT /api/categories] Error updating category:', err)
    return NextResponse.json(
      { error: err.message || 'Error al actualizar la categoría' },
      { status: 500 }
    )
  }
}
