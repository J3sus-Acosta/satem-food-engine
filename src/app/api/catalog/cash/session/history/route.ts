import { type NextRequest, NextResponse } from 'next/server'
import { cashService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const userId = searchParams.get('userId') || undefined
    const startStr = searchParams.get('startDate') || undefined
    const endStr = searchParams.get('endDate') || undefined

    const resolved = await TenantResolver.resolve(locationId)

    const startDate = startStr ? new Date(startStr) : undefined
    const endDate = endStr ? new Date(endStr) : undefined

    const history = await cashService.getHistory(resolved.locationId, {
      startDate,
      endDate,
      userId,
    })

    return NextResponse.json<ApiResponse<typeof history>>({ data: history }, { status: 200 })
  } catch (err) {
    console.error('[API.cash.session.history] Error:', err)
    const message = err instanceof Error ? err.message : 'Error al obtener historial de caja.'
    return NextResponse.json<ApiResponse<never>>({ error: message }, { status: 500 })
  }
}
