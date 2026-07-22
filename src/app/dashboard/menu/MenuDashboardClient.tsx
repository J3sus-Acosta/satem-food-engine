'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { MenuWithCategories, DailyMenuPreviewItem, MenuItemWithProduct } from '@/types'
import { Button } from '@/components/ui/button'
import { transformToDailyMenuRows, type ClientItemState } from '@/lib/menu/daily-menu-transformer'

interface MenuDashboardClientProps {
  initialMenu: MenuWithCategories | null
  locationId: string
  errorMsg: string | null
}

export default function MenuDashboardClient({
  initialMenu,
  locationId,
  errorMsg: initialError,
}: MenuDashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [menu, setMenu] = useState<MenuWithCategories | null>(initialMenu)
  const [changesByMenuItemId, setChangesByMenuItemId] = useState<Record<string, ClientItemState>>(
    () => {
      if (!initialMenu) return {}
      const initialStates: Record<string, ClientItemState> = {}

      initialMenu.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          const override = item.dailyMenuOverride
          initialStates[item.id] = {
            menuItemId: item.id,
            code: item.productVariant.sku || '',
            isAvailable: item.isAvailable,
            isVisible: item.isVisible,
            isHighlighted: override?.isHighlighted ?? false,
            price:
              override?.price !== null && override?.price !== undefined
                ? String(override.price)
                : '',
            stockDaily:
              override?.stockDaily !== null && override?.stockDaily !== undefined
                ? String(override.stockDaily)
                : '',
            sortOrder:
              override?.sortOrder !== null && override?.sortOrder !== undefined
                ? String(override.sortOrder)
                : '',
            notes: override?.notes || '',
          }
        })
      })
      return initialStates
    }
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<DailyMenuPreviewItem[]>([])
  const [previewErrors, setPreviewErrors] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  if (!menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center shadow-xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-4 text-xl font-bold text-rose-400">Error al cargar el menú</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error || 'No se pudieron recuperar los datos de la sucursal.'}
          </p>
          <a
            href="/dashboard/kitchen"
            className="mt-6 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Volver a la cocina
          </a>
        </div>
      </div>
    )
  }

  // Check if a specific menu item has any modified fields vs its current db state
  const isItemModified = (itemId: string) => {
    const current = changesByMenuItemId[itemId]
    if (!current) return false

    // Find the original item in the menu tree
    let originalItem: MenuItemWithProduct | null = null
    for (const cat of menu.categories) {
      const match = cat.items.find((it) => it.id === itemId)
      if (match) {
        originalItem = match
        break
      }
    }
    if (!originalItem) return false

    const override = originalItem.dailyMenuOverride
    const originalPrice =
      override?.price !== null && override?.price !== undefined ? String(override.price) : ''
    const originalStock =
      override?.stockDaily !== null && override?.stockDaily !== undefined
        ? String(override.stockDaily)
        : ''
    const originalAvailable = originalItem.isAvailable ? 'SI' : 'NO'
    const originalVisible = originalItem.isVisible ? 'SI' : 'NO'
    const originalDestacado = override?.isHighlighted ? 'SI' : 'NO'
    const originalOrden =
      override?.sortOrder !== null && override?.sortOrder !== undefined
        ? String(override.sortOrder)
        : ''
    const originalNota = override?.notes || ''

    const currentAvailable = current.isAvailable ? 'SI' : 'NO'
    const currentVisible = current.isVisible ? 'SI' : 'NO'
    const currentDestacado = current.isHighlighted ? 'SI' : 'NO'

    return (
      currentAvailable !== originalAvailable ||
      currentVisible !== originalVisible ||
      current.price !== originalPrice ||
      current.stockDaily !== originalStock ||
      currentDestacado !== originalDestacado ||
      current.sortOrder !== originalOrden ||
      current.notes !== originalNota
    )
  }

  // Update field in client state
  const handleFieldChange = <K extends keyof ClientItemState>(
    itemId: string,
    field: K,
    value: ClientItemState[K]
  ) => {
    setChangesByMenuItemId((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  // Reset a single row back to its db configuration
  const handleResetRow = (itemId: string) => {
    let originalItem: MenuItemWithProduct | null = null
    for (const cat of menu.categories) {
      const match = cat.items.find((it) => it.id === itemId)
      if (match) {
        originalItem = match
        break
      }
    }
    if (!originalItem) return

    const override = originalItem.dailyMenuOverride
    setChangesByMenuItemId((prev) => ({
      ...prev,
      [itemId]: {
        menuItemId: itemId,
        code: originalItem.productVariant.sku || '',
        isAvailable: originalItem.isAvailable,
        isVisible: originalItem.isVisible,
        isHighlighted: override?.isHighlighted ?? false,
        price:
          override?.price !== null && override?.price !== undefined ? String(override.price) : '',
        stockDaily:
          override?.stockDaily !== null && override?.stockDaily !== undefined
            ? String(override.stockDaily)
            : '',
        sortOrder:
          override?.sortOrder !== null && override?.sortOrder !== undefined
            ? String(override.sortOrder)
            : '',
        notes: override?.notes || '',
      },
    }))
  }

  // Preview Changes via API
  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreviewErrors([])
    setPreviewItems([])
    setError(null)

    try {
      // Map edit states to DailyMenuRowInput[] via transformer helper
      const statesList = Object.values(changesByMenuItemId)
      const rows = transformToDailyMenuRows(statesList)

      const res = await fetch('/api/menu/sync-daily/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, rows }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.details && Array.isArray(json.details)) {
          setPreviewErrors(json.details)
        } else {
          setPreviewErrors([json.error || 'Error al obtener la vista previa del menú'])
        }
      } else {
        setPreviewItems(json.data || [])
      }
      setPreviewOpen(true)
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setPreviewErrors([errorObj.message || 'Error al conectar con la API de vista previa'])
      setPreviewOpen(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Apply Changes via API and update state
  const handleApply = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setPreviewOpen(false)

    try {
      const statesList = Object.values(changesByMenuItemId)
      const rows = transformToDailyMenuRows(statesList)

      const res = await fetch('/api/menu/sync-daily/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, rows }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.details && Array.isArray(json.details)) {
          throw new Error(json.details.join('\n'))
        }
        throw new Error(json.error || 'Error al aplicar cambios del menú diario')
      }

      // Trigger Next.js router refresh to pull new server state in transition
      startTransition(() => {
        router.refresh()
      })

      // Update local menu state from API to ensure instant client-side update
      const menuRes = await fetch(`/api/menu?locationId=${locationId}`)
      if (menuRes.ok) {
        const menuJson = await menuRes.json()
        setMenu(menuJson.data)
      }

      setSuccessMessage('¡Menú operacional guardado y aplicado con éxito!')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj.message)
    } finally {
      setLoading(false)
    }
  }

  // Count total modified rows
  const modifiedCount = Object.keys(changesByMenuItemId).filter(isItemModified).length

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-100 select-none">
      {/* Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-800 pb-3">
        <a
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/menu"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
        >
          Menú Diario
        </a>
        <a
          href="/dashboard/catalog"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          Catálogo Maestro
        </a>
        <a
          href="/dashboard/kitchen"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          Cocina
        </a>
        <a
          href="/dashboard/pos"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          POS
        </a>
        <a
          href="/dashboard/cash"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          Caja
        </a>
      </div>

      {/* Header bar */}
      <header className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            SATEM Menú Operacional 🍔
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Gestión en tiempo real del menú diario de MCI Santiago. Sin tocar datos maestros.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {modifiedCount > 0 && (
            <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
              ⚡ {modifiedCount} cambios pendientes
            </span>
          )}

          <Button
            variant="outline"
            disabled={modifiedCount === 0 || previewLoading || loading || isPending}
            onClick={handlePreview}
            className="h-10 border-slate-700 text-sm font-extrabold text-slate-200 transition-all hover:bg-slate-800 active:scale-95"
          >
            {previewLoading ? 'Generando...' : '🔍 Vista previa'}
          </Button>

          <Button
            disabled={modifiedCount === 0 || loading || previewLoading || isPending}
            onClick={handleApply}
            className="h-10 border border-emerald-500 bg-emerald-600 px-5 text-sm font-extrabold text-white transition-all hover:bg-emerald-500 active:scale-95"
          >
            {loading || isPending ? 'Guardando...' : '💾 Aplicar cambios'}
          </Button>
        </div>
      </header>

      {/* Message banners */}
      {successMessage && (
        <div className="animate-fade-in mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex flex-col gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-400">
          <div className="flex items-center gap-3">
            <span>⚠️ Error al procesar:</span>
          </div>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-rose-300">
            {error}
          </pre>
        </div>
      )}

      {/* Main Categories list */}
      <div className="flex flex-col gap-8">
        {menu.categories.map((category) => {
          const categoryItems = category.items
          if (categoryItems.length === 0) return null

          return (
            <section key={category.id} className="flex flex-col gap-4">
              <h2 className="flex items-center gap-3 text-xl font-black text-slate-100">
                {category.name}
                <span className="bg-slate-850 rounded-md px-2 py-0.5 text-xs font-bold text-slate-400">
                  {categoryItems.length}
                </span>
              </h2>

              {/* Items Card List (Optimized for Tablet & Touch Viewport) */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {categoryItems.map((item) => {
                  const rowState = changesByMenuItemId[item.id]
                  if (!rowState) return null

                  // Calculate indicators
                  // `item.productVariant.product.basePrice` is the original suggested retail price!
                  const basePrice = item.productVariant.product.basePrice ?? item.price

                  const currentPrice = rowState.price !== '' ? Number(rowState.price) : basePrice
                  const priceDiff = currentPrice - basePrice
                  const priceDiscountPct =
                    basePrice > 0 ? Math.round((priceDiff / basePrice) * 100) : 0

                  const isModified = isItemModified(item.id)
                  const isAvailable = rowState.isAvailable
                  const isVisible = rowState.isVisible
                  const isHighlighted = rowState.isHighlighted

                  const stockValue = rowState.stockDaily !== '' ? Number(rowState.stockDaily) : null
                  const isOutOfStock = stockValue !== null && stockValue <= 0
                  const isLowStock = stockValue !== null && stockValue > 0 && stockValue <= 3

                  // Style configurations
                  const cardBorderColor = isModified
                    ? 'border-amber-500/50 bg-amber-950/5'
                    : !isAvailable
                      ? 'border-rose-950 bg-rose-950/5'
                      : 'border-slate-850 bg-slate-900/40'

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-4 rounded-2xl border p-4 md:flex-row ${cardBorderColor} transition-all duration-200`}
                    >
                      {/* Left Block: Image & Basic Info */}
                      <div className="flex gap-4 md:w-1/2">
                        {item.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.imageUrl}
                            alt={item.name || ''}
                            className="border-slate-850 h-20 w-20 shrink-0 rounded-xl border object-cover md:h-24 md:w-24"
                          />
                        ) : (
                          <div className="border-slate-850 flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border bg-slate-900 text-2xl md:h-24 md:w-24">
                            🍔
                          </div>
                        )}
                        <div className="flex min-w-0 flex-col justify-between py-1">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-base font-extrabold text-slate-100">
                                {item.name}
                              </span>
                              {isHighlighted && (
                                <span className="rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-amber-400 uppercase">
                                  ★ Destacado
                                </span>
                              )}
                            </div>
                            <span className="mt-0.5 block font-mono text-[11px] tracking-wider text-slate-400 uppercase">
                              SKU: {rowState.code}
                            </span>
                          </div>

                          {/* Quick Badge Indicators */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {!isAvailable && (
                              <span className="rounded border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                No Disponible
                              </span>
                            )}
                            {isOutOfStock && (
                              <span className="animate-pulse rounded border border-rose-500/30 bg-rose-600/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                AGOTADO
                              </span>
                            )}
                            {isLowStock && (
                              <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                STOCK BAJO ({stockValue})
                              </span>
                            )}
                            {!isVisible && (
                              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                                Oculto de la Carta
                              </span>
                            )}
                            {priceDiff !== 0 && (
                              <span
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                                  priceDiff < 0
                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                    : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                {priceDiff < 0
                                  ? `Descuento ${priceDiscountPct}%`
                                  : `Recargo +$${priceDiff}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Controls / Inputs (Touch & Tablet Optimized) */}
                      <div className="flex flex-col justify-between gap-3 border-t border-slate-800/80 pt-3 md:w-1/2 md:border-t-0 md:border-l md:pt-0 md:pl-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Price input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">
                              Precio del día ($)
                            </label>
                            <input
                              type="number"
                              placeholder={`Base: ${basePrice}`}
                              value={rowState.price}
                              onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-sm font-bold text-slate-100 outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Stock input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">
                              Stock Diario
                            </label>
                            <input
                              type="number"
                              placeholder="Sin límite"
                              value={rowState.stockDaily}
                              onChange={(e) =>
                                handleFieldChange(item.id, 'stockDaily', e.target.value)
                              }
                              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-sm font-bold text-slate-100 outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Orden input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">
                              Orden Visual
                            </label>
                            <input
                              type="number"
                              value={rowState.sortOrder}
                              onChange={(e) =>
                                handleFieldChange(item.id, 'sortOrder', e.target.value)
                              }
                              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 text-sm font-bold text-slate-100 outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Destacado & Available & Visible toggles */}
                          <div className="flex flex-col justify-end gap-1">
                            <div className="flex h-9 items-center gap-4">
                              <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={rowState.isHighlighted}
                                  onChange={(e) =>
                                    handleFieldChange(item.id, 'isHighlighted', e.target.checked)
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-slate-800 bg-slate-950 text-emerald-500 accent-emerald-500 focus:ring-0"
                                />
                                ⭐
                              </label>

                              <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={rowState.isAvailable}
                                  onChange={(e) =>
                                    handleFieldChange(item.id, 'isAvailable', e.target.checked)
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-slate-800 bg-slate-950 text-emerald-500 accent-emerald-500 focus:ring-0"
                                />
                                🟢 Disp.
                              </label>

                              <label className="flex cursor-pointer items-center gap-1.5 font-semibold text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={rowState.isVisible}
                                  onChange={(e) =>
                                    handleFieldChange(item.id, 'isVisible', e.target.checked)
                                  }
                                  className="h-4 w-4 cursor-pointer rounded border-slate-800 bg-slate-950 text-emerald-500 accent-emerald-500 focus:ring-0"
                                />
                                👁️ Vis.
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Note & Reset button */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nota del día (ej. Salsa extra gratis)"
                            value={rowState.notes}
                            onChange={(e) => handleFieldChange(item.id, 'notes', e.target.value)}
                            className="border-slate-855 h-8 flex-grow rounded-lg border bg-slate-950 px-2.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
                          />
                          {isModified && (
                            <button
                              onClick={() => handleResetRow(item.id)}
                              className="h-8 rounded-lg bg-slate-800 px-2.5 text-xs font-bold text-slate-400 transition hover:bg-slate-700 hover:text-slate-200 active:scale-95"
                              title="Restablecer valores originales"
                            >
                              ↩️ Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Modal / Dialog Backdrop for Preview Changes */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="animate-scale-up flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-100">
                🔍 Vista Previa del Cambio
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Content area */}
            <div className="flex-grow overflow-y-auto p-6">
              {previewErrors.length > 0 ? (
                <div className="flex flex-col gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-400">
                  <span className="flex items-center gap-2 text-base font-extrabold">
                    ❌ Errores de Validación en los Datos
                  </span>
                  <p className="text-sm text-rose-300">
                    Se encontraron los siguientes problemas. Corrígelos antes de guardar:
                  </p>
                  <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-xs font-semibold text-rose-200">
                    {previewErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : previewItems.length === 0 ? (
                <p className="py-6 text-center text-slate-400 italic">
                  No hay cambios operacionales detectados.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-slate-400">
                    A continuación se listan los cambios operacionales temporales que se guardarán
                    en la base de datos:
                  </p>

                  <div className="border-slate-855 overflow-hidden rounded-xl border bg-slate-950/30">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-slate-855 border-b bg-slate-950/60 text-xs font-bold tracking-wider text-slate-400 uppercase">
                          <th className="p-3">Producto</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Campo</th>
                          <th className="p-3">Antes</th>
                          <th className="p-3">Después</th>
                        </tr>
                      </thead>
                      <tbody className="divide-slate-855 divide-y">
                        {previewItems.map((item) => {
                          const diffs: { field: string; before: string; after: string }[] = []

                          if (item.before.price !== item.after.price) {
                            diffs.push({
                              field: 'Precio',
                              before: `$${item.before.price}`,
                              after: `$${item.after.price}`,
                            })
                          }
                          if (item.before.isAvailable !== item.after.isAvailable) {
                            diffs.push({
                              field: 'Disponible',
                              before: item.before.isAvailable ? 'SÍ' : 'NO',
                              after: item.after.isAvailable ? 'SÍ' : 'NO',
                            })
                          }
                          if (item.before.isVisible !== item.after.isVisible) {
                            diffs.push({
                              field: 'Visible',
                              before: item.before.isVisible ? 'SÍ' : 'NO',
                              after: item.after.isVisible ? 'SÍ' : 'NO',
                            })
                          }
                          if (item.before.isHighlighted !== item.after.isHighlighted) {
                            diffs.push({
                              field: 'Destacado',
                              before: item.before.isHighlighted ? 'SÍ' : 'NO',
                              after: item.after.isHighlighted ? 'SÍ' : 'NO',
                            })
                          }
                          if (item.before.stockDaily !== item.after.stockDaily) {
                            diffs.push({
                              field: 'Stock Diario',
                              before:
                                item.before.stockDaily !== null
                                  ? String(item.before.stockDaily)
                                  : 'Sin límite',
                              after:
                                item.after.stockDaily !== null
                                  ? String(item.after.stockDaily)
                                  : 'Sin límite',
                            })
                          }
                          if (item.before.sortOrder !== item.after.sortOrder) {
                            diffs.push({
                              field: 'Orden Visual',
                              before: String(item.before.sortOrder),
                              after: String(item.after.sortOrder),
                            })
                          }
                          if (item.before.notes !== item.after.notes) {
                            diffs.push({
                              field: 'Nota del día',
                              before: item.before.notes || 'Ninguna',
                              after: item.after.notes || 'Ninguna',
                            })
                          }

                          if (diffs.length === 0) return null

                          return (
                            <React.Fragment key={item.code}>
                              {diffs.map((diff, idx) => (
                                <tr
                                  key={`${item.code}-${idx}`}
                                  className="font-medium hover:bg-slate-900/30"
                                >
                                  {idx === 0 ? (
                                    <>
                                      <td
                                        className="p-3 align-middle font-bold text-slate-200"
                                        rowSpan={diffs.length}
                                      >
                                        {item.name}
                                      </td>
                                      <td
                                        className="p-3 align-middle font-mono text-xs text-slate-400"
                                        rowSpan={diffs.length}
                                      >
                                        {item.code}
                                      </td>
                                    </>
                                  ) : null}
                                  <td className="p-3 font-bold text-slate-300">{diff.field}</td>
                                  <td className="p-3 text-slate-500 line-through">{diff.before}</td>
                                  <td className="p-3 font-extrabold text-emerald-400">
                                    {diff.after}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-800 bg-slate-950/40 p-5">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="h-10 border-slate-700 text-sm text-slate-200"
              >
                Cerrar
              </Button>
              {previewErrors.length === 0 && previewItems.length > 0 && (
                <Button
                  onClick={handleApply}
                  className="h-10 border border-emerald-500 bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-500"
                >
                  Guardar y Aplicar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
