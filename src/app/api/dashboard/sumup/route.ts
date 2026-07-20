import { type NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/services'
import type { ApiResponse } from '@/types'
import { handleRouteError } from '@/lib/api'

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId') || undefined

    const diagnostics = await paymentService.getDiagnostics(locationId)

    return NextResponse.json<ApiResponse<Record<string, unknown>>>(
      { data: diagnostics },
      { status: 200 }
    )
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al consultar diagnóstico de SumUp',
      'GET /api/dashboard/sumup'
    )
  }
}
