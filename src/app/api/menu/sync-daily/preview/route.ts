import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import type { ApiResponse, DailyMenuPreviewItem, DailyMenuRowInput } from '@/types'
import { ValidationError } from '@/lib/errors'

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<DailyMenuPreviewItem[]>>> {
  try {
    const body = await req.json()
    const { locationId, rows } = body

    if (!locationId) {
      return NextResponse.json({ error: 'locationId es obligatorio' }, { status: 400 })
    }
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'rows debe ser un arreglo' }, { status: 400 })
    }

    const preview = await productService.previewDailyMenuOverrides(
      locationId,
      rows as DailyMenuRowInput[]
    )
    return NextResponse.json({ data: preview })
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const details = error.message.split(' | ')
      return NextResponse.json(
        { error: 'Error de validación en los datos del menú diario', details },
        { status: 400 }
      )
    }
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/menu/sync-daily/preview] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
