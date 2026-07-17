import { type NextRequest, NextResponse } from 'next/server'
import { kitchenService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse, OrderWithItems } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<OrderWithItems[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const inputLocation = searchParams.get('locationId') || searchParams.get('locationSlug')
    const resolved = await TenantResolver.resolve(inputLocation)

    const tickets = await kitchenService.getActiveTickets(resolved.locationId)
    return NextResponse.json<ApiResponse<OrderWithItems[]>>({ data: tickets }, { status: 200 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/kitchen/orders] Error:', err)
    return NextResponse.json<ApiResponse<never>>(
      { error: err.message || 'Error al obtener la cola de cocina' },
      { status: 500 }
    )
  }
}
