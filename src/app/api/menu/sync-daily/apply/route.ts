import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import type { ApiResponse, DailyMenuRowInput } from '@/types'
import { ValidationError } from '@/lib/errors'

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ code: string; status: 'success' }[]>>> {
  try {
    const body = await req.json()
    const { locationId, rows } = body

    if (!locationId) {
      return NextResponse.json({ error: 'locationId es obligatorio' }, { status: 400 })
    }
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'rows debe ser un arreglo' }, { status: 400 })
    }

    const results = await productService.applyDailyMenuOverrides(
      locationId,
      rows as DailyMenuRowInput[]
    )
    return NextResponse.json({ data: results })
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const details = error.message.split(' | ')
      return NextResponse.json(
        { error: 'Error de validación antes de aplicar los datos del menú diario', details },
        { status: 400 }
      )
    }
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/menu/sync-daily/apply] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
