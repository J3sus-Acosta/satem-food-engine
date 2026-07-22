/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { MenuWithCategories, DailyMenuPreviewItem, MenuItemWithProduct } from '@/types'
import { Button } from '@/components/ui/button'
import { transformToDailyMenuRows, type ClientItemState } from '@/lib/menu/daily-menu-transformer'
import {
  Search,
  Star,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  ShoppingBag,
  Eye,
  Save,
} from 'lucide-react'

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

  // Operational Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false)
  const [showHighlightedOnly, setShowHighlightedOnly] = useState(false)
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)

  // Check if a specific menu item has any modified fields vs its current db state
  const isItemModified = (itemId: string) => {
    const current = changesByMenuItemId[itemId]
    if (!current) return false

    if (!menu) return false
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

  const handleResetRow = (itemId: string) => {
    if (!menu) return
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
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setPreviewErrors([errorObj.message || 'Error al conectar con la API de vista previa'])
      setPreviewOpen(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Apply Changes via API
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

      startTransition(() => {
        router.refresh()
      })

      const menuRes = await fetch(`/api/menu?locationId=${locationId}&includeInvisible=true`)
      if (menuRes.ok) {
        const menuJson = await menuRes.json()
        setMenu(menuJson.data)
      }

      setSuccessMessage('¡Menú operacional guardado y aplicado con éxito!')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj.message)
    } finally {
      setLoading(false)
    }
  }

  // Count total modified rows
  const modifiedCount = Object.keys(changesByMenuItemId).filter(isItemModified).length

  // Date formatted in Spanish
  const formattedDate = useMemo(() => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
    const dateStr = today.toLocaleDateString('es-CL', options)
    return dateStr.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
  }, [])

  // Calculate stats dynamically based on UI state overrides
  const stats = useMemo(() => {
    let totalCount = 0
    let visibleCount = 0
    let outOfStockCount = 0
    let highlightedCount = 0

    if (menu) {
      menu.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          totalCount++
          const state = changesByMenuItemId[item.id]
          if (state) {
            if (state.isVisible) visibleCount++
            const stockValue = state.stockDaily !== '' ? Number(state.stockDaily) : null
            if (!state.isAvailable || (stockValue !== null && stockValue <= 0)) {
              outOfStockCount++
            }
            if (state.isHighlighted) highlightedCount++
          }
        })
      })
    }

    return { totalCount, visibleCount, outOfStockCount, highlightedCount }
  }, [menu, changesByMenuItemId])

  // Filter categories and their items based on UI search/filters
  const filteredCategories = useMemo(() => {
    if (!menu) return []

    return menu.categories
      .map((cat) => {
        const items = cat.items.filter((item) => {
          const state = changesByMenuItemId[item.id]
          if (!state) return false

          // Search query
          if (search.trim()) {
            const query = search.toLowerCase()
            const nameMatch = (item.name || '').toLowerCase().includes(query)
            const skuMatch = state.code.toLowerCase().includes(query)
            if (!nameMatch && !skuMatch) return false
          }

          // Category filter
          if (categoryFilter !== 'all' && cat.id !== categoryFilter) {
            return false
          }

          // Show Available checkbox
          if (showAvailableOnly && !state.isAvailable) {
            return false
          }

          // Show Out of Stock checkbox
          const stockValue = state.stockDaily !== '' ? Number(state.stockDaily) : null
          const isAgotado = !state.isAvailable || (stockValue !== null && stockValue <= 0)
          if (showOutOfStockOnly && !isAgotado) {
            return false
          }

          // Show Highlighted checkbox
          if (showHighlightedOnly && !state.isHighlighted) {
            return false
          }

          // Show Hidden checkbox
          if (showHiddenOnly && state.isVisible) {
            return false
          }

          return true
        })

        return {
          ...cat,
          items,
        }
      })
      .filter((cat) => cat.items.length > 0)
  }, [
    menu,
    changesByMenuItemId,
    search,
    categoryFilter,
    showAvailableOnly,
    showOutOfStockOnly,
    showHighlightedOnly,
    showHiddenOnly,
  ])

  if (!menu) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="mt-4 text-xl font-bold text-rose-600">Error al cargar el menú</h2>
          <p className="mt-2 text-sm text-slate-500">
            {error || 'No se pudieron recuperar los datos de la sucursal.'}
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Navigation subnavigation bar */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3">
        <a
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/menu"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
        >
          Cambios Rápidos Menú
        </a>
        <a
          href="/dashboard/catalog"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Catálogo Maestro
        </a>
        <a
          href="/dashboard/kitchen"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Cocina
        </a>
        <a
          href="/dashboard/pos"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          POS
        </a>
        <a
          href="/dashboard/cash"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Caja
        </a>
        <a
          href="/dashboard/users"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Usuarios
        </a>
      </div>

      {/* Header section */}
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cambios Rápidos Menú</h1>
          <p className="mt-1 text-sm text-slate-500">
            Centro de control y overrides operacionales del menú diario de la sucursal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modifiedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              ⚡ {modifiedCount} modificaciones pendientes
            </span>
          )}

          <Button
            variant="outline"
            disabled={modifiedCount === 0 || previewLoading || loading || isPending}
            onClick={handlePreview}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold shadow-sm"
          >
            {previewLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 text-slate-500" />
            )}
            Vista Previa
          </Button>

          <Button
            disabled={modifiedCount === 0 || loading || previewLoading || isPending}
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
          >
            {loading || isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Aplicar Cambios
          </Button>
        </div>
      </header>

      {/* Operational Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase">Hoy</span>
            <Calendar className="text-slate-350 h-4 w-4 shrink-0" />
          </div>
          <div className="mt-2 text-sm leading-tight font-bold tracking-tight text-slate-800">
            {formattedDate}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase">Total Menú</span>
            <ShoppingBag className="text-slate-350 h-4 w-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalCount}</div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase">Visibles</span>
            <Eye className="text-slate-350 h-4 w-4 shrink-0" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-emerald-650 text-2xl font-black">{stats.visibleCount}</span>
            <span className="text-xs font-semibold text-slate-400">
              / {stats.totalCount - stats.visibleCount} ocultos
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase">Agotados</span>
            <AlertCircle className="text-slate-350 h-4 w-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{stats.outOfStockCount}</div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold tracking-wider uppercase">Destacados</span>
            <Star className="text-slate-350 h-4 w-4 shrink-0" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-500">{stats.highlightedCount}</div>
        </div>
      </div>

      {/* Message banners */}
      {successMessage && (
        <div className="animate-in fade-in slide-in-from-top mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>Error al guardar cambios:</span>
          </div>
          <pre className="overflow-x-auto pl-7 font-mono text-xs whitespace-pre-wrap text-rose-700">
            {error}
          </pre>
        </div>
      )}

      {/* Main operational table container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Actions bar (Fila de acciones) */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex max-w-3xl flex-grow flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">Categoría: Todas</option>
              {menu.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Checkbox filter group */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <span>Disponibles</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={showOutOfStockOnly}
                  onChange={(e) => setShowOutOfStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <span>Agotados</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={showHighlightedOnly}
                  onChange={(e) => setShowHighlightedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <span>Destacados</span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={showHiddenOnly}
                  onChange={(e) => setShowHiddenOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <span>Ocultos</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync from catalog button placeholder */}
            <Button
              disabled
              variant="outline"
              className="flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-400 opacity-55"
              title="Próxima integración: sincronizar directamente desde catálogo maestro"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar Catálogo
            </Button>
          </div>
        </div>

        {/* Future capabilities row (Grisados / Marcados para futuras implementaciones) */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] font-medium text-slate-400">
          <span className="mr-2 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-500 uppercase">
            Futuras Acciones
          </span>
          <button disabled className="hover:text-slate-650 cursor-not-allowed opacity-60">
            ☑ Selección Múltiple
          </button>
          <span className="text-slate-300">|</span>
          <button disabled className="hover:text-slate-650 cursor-not-allowed opacity-60">
            Duplicar menú de ayer
          </button>
          <span className="text-slate-300">|</span>
          <button disabled className="hover:text-slate-650 cursor-not-allowed opacity-60">
            Programar menú
          </button>
          <span className="text-slate-300">|</span>
          <button disabled className="hover:text-slate-650 cursor-not-allowed opacity-60">
            Importar menú
          </button>
        </div>

        {/* Unified Table View */}
        <div className="overflow-x-auto">
          {filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic">
              No se encontraron productos que coincidan con los filtros activos.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-500">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600">
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      disabled
                      className="border-slate-350 h-3.5 w-3.5 cursor-not-allowed rounded bg-slate-100 opacity-40"
                    />
                  </th>
                  <th className="min-w-[240px] px-6 py-4">Producto</th>
                  <th className="w-28 px-4 py-4 text-center">Precio Diario ($)</th>
                  <th className="w-24 px-4 py-4 text-center">Stock Diario</th>
                  <th className="w-24 px-4 py-4 text-center">Disponible</th>
                  <th className="w-24 px-4 py-4 text-center">Destacado</th>
                  <th className="w-24 px-4 py-4 text-center">Visible</th>
                  <th className="w-20 px-4 py-4 text-center">Orden</th>
                  <th className="w-28 px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => (
                  <React.Fragment key={cat.id}>
                    {/* Category Divider Header Row */}
                    <tr className="bg-slate-55 bg-slate-100/50">
                      <td
                        colSpan={9}
                        className="text-slate-550 px-4 py-2 text-xs font-bold tracking-wider uppercase select-none"
                      >
                        📂 {cat.name}
                      </td>
                    </tr>

                    {/* Products Row */}
                    {cat.items.map((item) => {
                      const state = changesByMenuItemId[item.id]
                      if (!state) return null

                      const basePrice = item.productVariant.product.basePrice ?? item.price
                      const currentPrice = state.price !== '' ? Number(state.price) : basePrice
                      const priceDiff = currentPrice - basePrice
                      const priceDiscountPct =
                        basePrice > 0 ? Math.round((priceDiff / basePrice) * 100) : 0

                      const isModified = isItemModified(item.id)
                      const stockValue = state.stockDaily !== '' ? Number(state.stockDaily) : null
                      const isOutOfStock =
                        !state.isAvailable || (stockValue !== null && stockValue <= 0)

                      return (
                        <tr
                          key={item.id}
                          className={`group transition-all hover:bg-slate-50/70 ${
                            isModified ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Selection Checkbox (disabled placeholder) */}
                          <td className="px-4 py-4 text-center align-middle">
                            <input
                              type="checkbox"
                              disabled
                              className="h-3.5 w-3.5 cursor-not-allowed rounded border-slate-300 opacity-40"
                            />
                          </td>

                          {/* Product Image, Name, SKU, and Daily Note Input */}
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name || ''}
                                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
                                />
                              ) : (
                                <div className="bg-slate-150 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-base shadow-sm">
                                  🍔
                                </div>
                              )}
                              <div className="flex min-w-0 flex-grow flex-col">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm leading-tight font-bold text-slate-800">
                                    {item.name}
                                  </span>
                                  {state.isHighlighted && (
                                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 select-none">
                                      ★ Destacado
                                    </span>
                                  )}
                                  {isOutOfStock && (
                                    <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 select-none">
                                      Agotado
                                    </span>
                                  )}
                                </div>
                                <span className="mt-0.5 font-mono text-[9px] text-slate-400">
                                  SKU: {state.code}
                                </span>

                                {/* Daily Note inline input */}
                                <input
                                  type="text"
                                  placeholder="Escribir nota del día (ej. Papas fritas grandes)..."
                                  value={state.notes}
                                  onChange={(e) =>
                                    handleFieldChange(item.id, 'notes', e.target.value)
                                  }
                                  className="mt-1.5 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-700 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>

                          {/* Daily Price Input */}
                          <td className="px-4 py-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center gap-1">
                              <input
                                type="number"
                                placeholder={String(basePrice)}
                                value={state.price}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'price', e.target.value)
                                }
                                className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-center text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              {priceDiff !== 0 && (
                                <span
                                  className={`text-[9px] font-bold ${
                                    priceDiff < 0 ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {priceDiff < 0 ? `${priceDiscountPct}%` : `+$${priceDiff}`}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Daily Stock Input */}
                          <td className="px-4 py-4 text-center align-middle">
                            <input
                              type="number"
                              placeholder="Ilimitado"
                              value={state.stockDaily}
                              onChange={(e) =>
                                handleFieldChange(item.id, 'stockDaily', e.target.value)
                              }
                              className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </td>

                          {/* Available Switch (Touch optimized size) */}
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(item.id, 'isAvailable', !state.isAvailable)
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                state.isAvailable ? 'bg-emerald-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  state.isAvailable ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Highlighted Switch */}
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(item.id, 'isHighlighted', !state.isHighlighted)
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                state.isHighlighted ? 'bg-amber-500' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  state.isHighlighted ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Visible Switch */}
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                handleFieldChange(item.id, 'isVisible', !state.isVisible)
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                state.isVisible ? 'bg-slate-800' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  state.isVisible ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Sort Order Input */}
                          <td className="px-4 py-4 text-center align-middle">
                            <input
                              type="number"
                              value={state.sortOrder}
                              onChange={(e) =>
                                handleFieldChange(item.id, 'sortOrder', e.target.value)
                              }
                              className="h-8 w-12 rounded-lg border border-slate-200 px-2 text-center text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900"
                            />
                          </td>

                          {/* Reset / Actions column */}
                          <td className="px-6 py-4 text-right align-middle">
                            {isModified ? (
                              <button
                                onClick={() => handleResetRow(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 active:scale-95"
                                title="Deshacer cambios de esta fila"
                              >
                                Deshacer
                              </button>
                            ) : (
                              <span className="text-slate-350 text-[10px] font-medium italic select-none">
                                Sin cambios
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PREVIEW AND APPLY CHANGES DIALOG MODAL */}
      {previewOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            {/* Close button */}
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">🔍 Vista Previa del Cambio</h3>
            <p className="mt-1 border-b border-slate-100 pb-3 text-xs text-slate-500">
              Confirma los overrides temporales del menú diario antes de aplicarlos.
            </p>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto py-4">
              {previewErrors.length > 0 ? (
                <div className="flex flex-col gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-600" />
                    Errores de Validación en los Datos
                  </span>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[11px] font-semibold text-rose-700">
                    {previewErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : previewItems.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400 italic">
                  No se encontraron cambios pendientes a guardar.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500">
                    Los siguientes cambios se escribirán como overrides en la base de datos de la
                    sucursal:
                  </p>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-left text-xs text-slate-500">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          <th className="p-3">Producto</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Campo</th>
                          <th className="p-3">Antes</th>
                          <th className="p-3">Después</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
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
                              before: item.before.isAvailable ? 'Sí' : 'No',
                              after: item.after.isAvailable ? 'Sí' : 'No',
                            })
                          }
                          if (item.before.isVisible !== item.after.isVisible) {
                            diffs.push({
                              field: 'Visible',
                              before: item.before.isVisible ? 'Sí' : 'No',
                              after: item.after.isVisible ? 'Sí' : 'No',
                            })
                          }
                          if (item.before.isHighlighted !== item.after.isHighlighted) {
                            diffs.push({
                              field: 'Destacado',
                              before: item.before.isHighlighted ? 'Sí' : 'No',
                              after: item.after.isHighlighted ? 'Sí' : 'No',
                            })
                          }
                          if (item.before.stockDaily !== item.after.stockDaily) {
                            diffs.push({
                              field: 'Stock Diario',
                              before:
                                item.before.stockDaily !== null
                                  ? String(item.before.stockDaily)
                                  : 'Ilimitado',
                              after:
                                item.after.stockDaily !== null
                                  ? String(item.after.stockDaily)
                                  : 'Ilimitado',
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
                                <tr key={`${item.code}-${idx}`} className="hover:bg-slate-50">
                                  {idx === 0 ? (
                                    <>
                                      <td
                                        className="p-3 align-middle font-bold text-slate-800"
                                        rowSpan={diffs.length}
                                      >
                                        {item.name}
                                      </td>
                                      <td
                                        className="p-3 align-middle font-mono text-[10px] text-slate-400"
                                        rowSpan={diffs.length}
                                      >
                                        {item.code}
                                      </td>
                                    </>
                                  ) : null}
                                  <td className="text-slate-650 p-3 font-bold">{diff.field}</td>
                                  <td className="p-3 text-slate-400 line-through">{diff.before}</td>
                                  <td className="p-3 font-bold text-emerald-600">{diff.after}</td>
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

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
              >
                Cerrar
              </Button>
              {previewErrors.length === 0 && previewItems.length > 0 && (
                <Button
                  onClick={handleApply}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar y Guardar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
