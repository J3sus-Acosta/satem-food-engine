import 'server-only'

import type { DailyMenuRowInput } from '@/types'

/**
 * Represents a single validated row received from Google Sheets via n8n.
 * Uses the short human-readable "Código" rather than internal IDs.
 * Mirrors the column structure of the "Menú Diario" sheet tab.
 */
export interface SheetRow {
  /** Short code identifying the product variant (e.g. "BUR001", "PAP001"). */
  Código: string
  /** "SI" | "NO" — whether the item is available for ordering today. */
  Disponible: string
  /** "SI" | "NO" — whether the item is visible on the public menu. */
  Visible: string
  /** Override price for today. Empty/null means "use master price". */
  Precio?: string | number | null
  /** Daily stock limit. Empty/null means unlimited. */
  Stock?: string | number | null
  /** "SI" | "NO" — whether the item is highlighted on the menu today. */
  Destacado: string
  /** Visual sort order override. Empty/null means "use master order". */
  Orden?: string | number | null
  /** Short operational note shown to customers today. */
  Nota?: string | null
}

/**
 * Validation error for a single sheet row.
 */
export interface SheetRowValidationError {
  /** 1-based row index in the Google Sheets document (including header). */
  row: number
  /** The Código value that triggered the error. */
  code: string
  /** Human-readable problem description in Spanish. */
  message: string
}

/**
 * Result returned by MenuSyncService.validateRows().
 */
export interface SheetValidationResult {
  isValid: boolean
  errors: SheetRowValidationError[]
}

/**
 * Parses and validates an array of raw sheet rows from n8n.
 *
 * Separate from ProductService.previewDailyMenuOverrides to:
 *  1. Provide richer error format ("Fila X - CODE - message").
 *  2. Detect duplicate Código entries in the same payload (not caught by the domain service).
 *  3. Keep Google Sheets adapter logic isolated from domain logic.
 *
 * Does NOT access the database — only performs structural/type validation.
 * Database existence checks are deferred to ProductService.
 *
 * @param rows — Raw rows from Google Sheets (provided by n8n after column mapping).
 * @returns SheetValidationResult with all detected errors.
 */
export function validateSheetRows(rows: SheetRow[]): SheetValidationResult {
  const errors: SheetRowValidationError[] = []
  const seenCodes = new Set<string>()

  // Row index 1 = header row in Sheets; data rows start at 2.
  rows.forEach((row, idx) => {
    const sheetRow = idx + 2 // header occupies row 1
    const code = String(row.Código ?? '').trim()

    // ── 1. Código obligatorio ────────────────────────────────────────
    if (!code) {
      errors.push({ row: sheetRow, code: '(vacío)', message: 'El campo Código es obligatorio' })
      return
    }

    // ── 2. Código duplicado ──────────────────────────────────────────
    if (seenCodes.has(code)) {
      errors.push({
        row: sheetRow,
        code,
        message: `El código '${code}' está duplicado en el archivo`,
      })
    }
    seenCodes.add(code)

    // ── 3. Disponible ────────────────────────────────────────────────
    const disponible = String(row.Disponible ?? '')
      .trim()
      .toUpperCase()
    if (disponible !== 'SI' && disponible !== 'NO') {
      errors.push({
        row: sheetRow,
        code,
        message: `El campo Disponible debe ser 'SI' o 'NO' (recibido: '${row.Disponible}')`,
      })
    }

    // ── 4. Visible ───────────────────────────────────────────────────
    const visible = String(row.Visible ?? '')
      .trim()
      .toUpperCase()
    if (visible !== 'SI' && visible !== 'NO') {
      errors.push({
        row: sheetRow,
        code,
        message: `El campo Visible debe ser 'SI' o 'NO' (recibido: '${row.Visible}')`,
      })
    }

    // ── 5. Destacado ─────────────────────────────────────────────────
    const destacado = String(row.Destacado ?? '')
      .trim()
      .toUpperCase()
    if (destacado !== 'SI' && destacado !== 'NO') {
      errors.push({
        row: sheetRow,
        code,
        message: `El campo Destacado debe ser 'SI' o 'NO' (recibido: '${row.Destacado}')`,
      })
    }

    // ── 6. Precio ────────────────────────────────────────────────────
    if (row.Precio !== undefined && row.Precio !== null && String(row.Precio).trim() !== '') {
      const precio = Number(row.Precio)
      if (isNaN(precio) || precio <= 0) {
        errors.push({
          row: sheetRow,
          code,
          message: `El campo Precio debe ser un número positivo mayor a 0 (recibido: '${row.Precio}')`,
        })
      }
    }

    // ── 7. Stock ─────────────────────────────────────────────────────
    if (row.Stock !== undefined && row.Stock !== null && String(row.Stock).trim() !== '') {
      const stock = Number(row.Stock)
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        errors.push({
          row: sheetRow,
          code,
          message: `El campo Stock debe ser un número entero mayor o igual a 0 (recibido: '${row.Stock}')`,
        })
      }
    }

    // ── 8. Orden ─────────────────────────────────────────────────────
    if (row.Orden !== undefined && row.Orden !== null && String(row.Orden).trim() !== '') {
      const orden = Number(row.Orden)
      if (isNaN(orden) || orden < 0 || !Number.isInteger(orden)) {
        errors.push({
          row: sheetRow,
          code,
          message: `El campo Orden debe ser un número entero mayor o igual a 0 (recibido: '${row.Orden}')`,
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Formats a list of SheetRowValidationErrors into the canonical string format:
 * "Fila {row} - {code} - {message}"
 *
 * This format matches the error display expected by the n8n workflow and
 * the Google Sheets status cell.
 */
export function formatSheetErrors(errors: SheetRowValidationError[]): string[] {
  return errors.map((e) => `Fila ${e.row} - ${e.code} - ${e.message}`)
}

/**
 * Converts validated SheetRows to the canonical DailyMenuRowInput[]
 * consumed by ProductService.previewDailyMenuOverrides and applyDailyMenuOverrides.
 *
 * This is the adapter function between the Google Sheets data model
 * and the domain service contract. SheetRow is structurally identical
 * to DailyMenuRowInput — this function makes the mapping explicit and
 * is the single place to modify if column names ever change.
 */
export function adaptSheetRowsToDomain(rows: SheetRow[]): DailyMenuRowInput[] {
  return rows.map((row) => ({
    Código: String(row.Código).trim(),
    Disponible: String(row.Disponible).trim().toUpperCase(),
    Visible: String(row.Visible).trim().toUpperCase(),
    Destacado: String(row.Destacado).trim().toUpperCase(),
    Precio: row.Precio ?? null,
    Stock: row.Stock ?? null,
    Orden: row.Orden ?? null,
    Nota: row.Nota ? String(row.Nota).trim() : null,
  }))
}

/**
 * Validates the Menu Sync webhook secret header against the configured secret.
 *
 * Returns true if the secret matches or if MENU_SYNC_SECRET is not configured
 * (development/open mode). Returns false if a secret IS configured but doesn't match.
 *
 * @param receivedSecret — Value of the `x-menu-sync-secret` request header.
 */
export function validateMenuSyncSecret(receivedSecret: string | null): boolean {
  const configuredSecret = process.env.MENU_SYNC_SECRET
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    if (!configuredSecret || configuredSecret.trim() === '') {
      console.error(
        '[MenuSyncService] Refusing webhook validation: MENU_SYNC_SECRET is not configured or empty in production environment.'
      )
      return false
    }
  } else {
    // In development mode, allow bypassing check if no secret is set
    if (!configuredSecret) {
      return true
    }
  }

  return receivedSecret === configuredSecret
}
