import { type NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services'
import type { ApiResponse, DailyMenuPreviewItem } from '@/types'
import { ValidationError } from '@/lib/errors'
import {
  validateMenuSyncSecret,
  validateSheetRows,
  adaptSheetRowsToDomain,
  formatSheetErrors,
  type SheetRow,
} from '@/services/menu-sync'

/**
 * POST /api/webhooks/menu-sync
 *
 * Dedicated webhook endpoint for the n8n + Google Sheets Menú Diario sync flow.
 *
 * This endpoint orchestrates the full Validate → Preview → Apply cycle in a
 * single HTTP call — optimised for the n8n automated workflow where a split
 * Preview/Apply flow would require complex state management in n8n.
 *
 * Security: Validates the `x-menu-sync-secret` header against MENU_SYNC_SECRET
 * env variable. If the env variable is not set, the endpoint accepts all requests
 * (development mode). In production, always configure MENU_SYNC_SECRET.
 *
 * Expected body:
 * {
 *   "locationId": "<internal locationId from DB>",
 *   "rows": [
 *     {
 *       "Código": "BUR001",
 *       "Disponible": "SI",
 *       "Visible": "SI",
 *       "Precio": 3500,
 *       "Stock": 20,
 *       "Destacado": "NO",
 *       "Orden": 1,
 *       "Nota": "¡Recomendado del Chef!"
 *     }
 *   ]
 * }
 *
 * Success response (HTTP 200):
 * {
 *   "data": {
 *     "appliedCount": 5,
 *     "results": [{ "code": "BUR001", "status": "success" }, ...]
 *   }
 * }
 *
 * Validation failure response (HTTP 400):
 * {
 *   "error": "Error de validación en el payload de sincronización",
 *   "details": ["Fila 2 - BUR001 - El precio debe ser positivo", ...]
 * }
 */
export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    ApiResponse<{ appliedCount: number; results: { code: string; status: 'success' }[] }>
  >
> {
  // ── 1. Validate secret ──────────────────────────────────────────────────────
  const receivedSecret = req.headers.get('x-menu-sync-secret')
  if (!validateMenuSyncSecret(receivedSecret)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const body = await req.json()
    const { locationId, rows } = body as { locationId?: string; rows?: SheetRow[] }

    if (!locationId || typeof locationId !== 'string') {
      return NextResponse.json({ error: 'locationId es obligatorio' }, { status: 400 })
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'rows debe ser un arreglo no vacío de filas del Menú Diario' },
        { status: 400 }
      )
    }

    // ── 3. Structural validation (MenuSyncService) ────────────────────────────
    const validationResult = validateSheetRows(rows)
    if (!validationResult.isValid) {
      const formattedErrors = formatSheetErrors(validationResult.errors)
      return NextResponse.json(
        {
          error: 'Error de validación en el payload de sincronización',
          details: formattedErrors,
        },
        { status: 400 }
      )
    }

    // ── 4. Adapt to domain contract ───────────────────────────────────────────
    const domainRows = adaptSheetRowsToDomain(rows)

    // ── 5. Preview (domain validation — checks existence of codes in DB) ──────
    let _preview: DailyMenuPreviewItem[]
    try {
      _preview = await productService.previewDailyMenuOverrides(locationId, domainRows)
    } catch (previewError: unknown) {
      if (previewError instanceof ValidationError) {
        const details = previewError.message.split(' | ')
        return NextResponse.json(
          {
            error: 'Error de validación de dominio durante preview',
            details,
          },
          { status: 400 }
        )
      }
      throw previewError
    }

    // ── 6. Apply ──────────────────────────────────────────────────────────────
    const results = await productService.applyDailyMenuOverrides(locationId, domainRows)

    return NextResponse.json({
      data: {
        appliedCount: results.length,
        results,
      },
    })
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const details = error.message.split(' | ')
      return NextResponse.json(
        { error: 'Error de validación antes de aplicar los datos del menú diario', details },
        { status: 400 }
      )
    }
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/webhooks/menu-sync] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
