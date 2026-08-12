'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileSpreadsheet,
  Filter,
  Columns,
  Bookmark,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  PackageCheck,
  DollarSign,
  Tag,
  RotateCcw,
  TrendingUp,
} from 'lucide-react'
import { SubNavBar } from '@/components/layout/SubNavBar'
import { COLUMN_LABELS, DEFAULT_VISIBLE_COLUMNS } from '@/services/reports/CustomReportService'
import type {
  SalesDetailReportColumnKey,
  SalesDetailReportRow,
  SalesReportSummary,
  SalesReportQueryFilters,
  ReportTemplateDTO,
  ReportTemplateConfiguration,
} from '@/types'

interface ReportsDashboardClientProps {
  userRole: string
  userId: string
  cashiers: { id: string; name: string; username: string }[]
}

const ALL_COLUMNS = Object.keys(COLUMN_LABELS) as SalesDetailReportColumnKey[]

export function ReportsDashboardClient({
  userRole,
  userId,
  cashiers,
}: ReportsDashboardClientProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState('SALES_DETAIL')

  // Column Customization
  const [visibleColumns, setVisibleColumns] =
    useState<SalesDetailReportColumnKey[]>(DEFAULT_VISIBLE_COLUMNS)
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false)

  // Filters State
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [cashierId, setCashierId] = useState('')
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [discountSearch, setDiscountSearch] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<SalesDetailReportColumnKey>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)

  // Query Result State
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [summary, setSummary] = useState<SalesReportSummary>({
    totalOrders: 0,
    totalItemsSold: 0,
    totalGrossSales: 0,
    totalDiscounts: 0,
    totalRefunds: 0,
    totalNetSales: 0,
  })
  const [rows, setRows] = useState<SalesDetailReportRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Templates State
  const [templates, setTemplates] = useState<ReportTemplateDTO[]>([])
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [templateIsShared, setTemplateIsShared] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Export State
  const [isExporting, setIsExporting] = useState(false)

  // ─── Fetch Report Data ──────────────────────────────────────────────────────
  const fetchReportData = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')

    try {
      const filtersPayload: SalesReportQueryFilters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        orderNumber: orderNumber.trim() || undefined,
        customerSearch: customerSearch.trim() || undefined,
        cashierId: cashierId || undefined,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined,
        discountSearch: discountSearch.trim() || undefined,
        sortBy,
        sortOrder,
        page,
        pageSize,
      }

      const res = await fetch('/api/reports/sales-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtersPayload),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al obtener datos del reporte.')
      }

      if (json.data) {
        setSummary(json.data.summary)
        setRows(json.data.rows)
        setTotalRows(json.data.pagination.totalRows)
        setTotalPages(json.data.pagination.totalPages)
      }
    } catch (err: unknown) {
      console.error('[fetchReportData] Error:', err)
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorMsg(error.message || 'Error al conectar con el servidor.')
    } finally {
      setIsLoading(false)
    }
  }, [
    startDate,
    endDate,
    orderNumber,
    customerSearch,
    cashierId,
    status,
    paymentMethod,
    discountSearch,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!ignore) {
        await fetchReportData()
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [fetchReportData])

  // ─── Fetch Templates ────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/reports/templates')
      const json = await res.json()
      if (res.ok && json.data) {
        setTemplates(json.data)
      }
    } catch (err) {
      console.error('[fetchTemplates] Error:', err)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (!ignore) {
        await fetchTemplates()
      }
    }
    void load()
    return () => {
      ignore = true
    }
  }, [fetchTemplates])

  // ─── Reset Filters ──────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setOrderNumber('')
    setCustomerSearch('')
    setCashierId('')
    setStatus('')
    setPaymentMethod('')
    setDiscountSearch('')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  // ─── Toggle Sorting ─────────────────────────────────────────────────────────
  const handleSort = (colKey: SalesDetailReportColumnKey) => {
    if (sortBy === colKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(colKey)
      setSortOrder('desc')
    }
    setPage(1)
  }

  // ─── Toggle Column Visibility ───────────────────────────────────────────────
  const toggleColumn = (colKey: SalesDetailReportColumnKey) => {
    if (visibleColumns.includes(colKey)) {
      if (visibleColumns.length <= 1) return // Keep at least one column visible
      setVisibleColumns(visibleColumns.filter((c) => c !== colKey))
    } else {
      setVisibleColumns([...visibleColumns, colKey])
    }
  }

  // ─── Excel Export ───────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const payload = {
        filters: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          orderNumber: orderNumber.trim() || undefined,
          customerSearch: customerSearch.trim() || undefined,
          cashierId: cashierId || undefined,
          status: status || undefined,
          paymentMethod: paymentMethod || undefined,
          discountSearch: discountSearch.trim() || undefined,
          sortBy,
          sortOrder,
        },
        visibleColumns,
      }

      const res = await fetch('/api/reports/sales-detail/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Error al generar el archivo Excel.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `SATEM_Reporte_Ventas_${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'No se pudo descargar el archivo Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Save Template ──────────────────────────────────────────────────────────
  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateName.trim()) return

    setIsSavingTemplate(true)
    try {
      const config: ReportTemplateConfiguration = {
        visibleColumns,
        columnOrder: visibleColumns,
        filters: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          orderNumber: orderNumber || undefined,
          customerSearch: customerSearch || undefined,
          cashierId: cashierId || undefined,
          status: status || undefined,
          paymentMethod: paymentMethod || undefined,
          discountSearch: discountSearch || undefined,
        },
        sortBy,
        sortOrder,
        reportType,
      }

      const res = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDesc.trim() || null,
          isShared: templateIsShared,
          configuration: config,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al guardar la plantilla.')
      }

      setTemplateName('')
      setTemplateDesc('')
      setTemplateIsShared(false)
      setIsSaveModalOpen(false)
      fetchTemplates()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Error al guardar plantilla.')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // ─── Apply Template ─────────────────────────────────────────────────────────
  const handleApplyTemplate = (template: ReportTemplateDTO) => {
    const cfg = template.configuration
    if (cfg.visibleColumns && Array.isArray(cfg.visibleColumns)) {
      setVisibleColumns(cfg.visibleColumns)
    }
    if (cfg.sortBy) setSortBy(cfg.sortBy as SalesDetailReportColumnKey)
    if (cfg.sortOrder) setSortOrder(cfg.sortOrder)

    if (cfg.filters) {
      setStartDate(cfg.filters.startDate || '')
      setEndDate(cfg.filters.endDate || '')
      setOrderNumber(cfg.filters.orderNumber || '')
      setCustomerSearch(cfg.filters.customerSearch || '')
      setCashierId(cfg.filters.cashierId || '')
      setStatus(cfg.filters.status || '')
      setPaymentMethod(cfg.filters.paymentMethod || '')
      setDiscountSearch(cfg.filters.discountSearch || '')
    }

    setPage(1)
    setIsTemplatesModalOpen(false)
  }

  // ─── Delete Template ────────────────────────────────────────────────────────
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla de reporte?')) return

    try {
      const res = await fetch(`/api/reports/templates/${templateId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchTemplates()
      }
    } catch (err) {
      console.error('[handleDeleteTemplate] Error:', err)
    }
  }

  return (
    <main className="bg-background min-h-screen pb-20 select-none">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6">
        {/* Sub Navigation Bar */}
        <SubNavBar activeTab="reports" currentUserRole={userRole} />

        {/* Page Title & Control Toolbar */}
        <div className="bg-card border-border/50 flex flex-col gap-4 rounded-3xl border p-5 shadow-xs md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-xl font-black tracking-tight">
              <FileSpreadsheet className="text-primary h-6 w-6" />
              Módulo de Reportes Personalizados
            </h1>
            <p className="text-muted-foreground text-xs leading-normal">
              Filtra, personaliza columnas, guarda plantillas y exporta directamente a Excel
              (.xlsx).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Report Type Selector */}
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-muted border-border/60 text-foreground focus:border-primary rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="SALES_DETAIL">Detalle de Ventas</option>
            </select>

            {/* Templates Selector / Manager button */}
            <button
              type="button"
              onClick={() => setIsTemplatesModalOpen(true)}
              className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-all"
            >
              <Bookmark size={15} className="text-primary" />
              <span>Mis Plantillas ({templates.length})</span>
            </button>

            {/* Save Template Button */}
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="bg-card hover:bg-muted text-foreground border-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-xs transition-all"
            >
              <Plus size={15} className="text-primary" />
              <span>Guardar como plantilla</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-emerald-700 disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>Generando Excel...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={15} />
                  <span>Exportar Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Card 1: Total Orders */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Ventas (Pedidos)
              </span>
              <ShoppingBag size={15} className="text-primary shrink-0" />
            </div>
            <p className="text-xl font-black tracking-tight">{summary.totalOrders}</p>
          </div>

          {/* Card 2: Items Sold */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Prod. Vendidos
              </span>
              <PackageCheck size={15} className="shrink-0 text-blue-500" />
            </div>
            <p className="text-xl font-black tracking-tight">{summary.totalItemsSold}</p>
          </div>

          {/* Card 3: Gross Sales */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Ventas Brutas
              </span>
              <DollarSign size={15} className="shrink-0 text-emerald-500" />
            </div>
            <p className="text-xl font-black tracking-tight">
              ${summary.totalGrossSales.toLocaleString('es-CL')}
            </p>
          </div>

          {/* Card 4: Discounts */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Descuentos
              </span>
              <Tag size={15} className="shrink-0 text-amber-500" />
            </div>
            <p className="text-xl font-black tracking-tight text-amber-500">
              -${summary.totalDiscounts.toLocaleString('es-CL')}
            </p>
          </div>

          {/* Card 5: Refunds / Voids */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Devoluciones
              </span>
              <RotateCcw size={15} className="shrink-0 text-red-500" />
            </div>
            <p className="text-xl font-black tracking-tight text-red-500">
              -${summary.totalRefunds.toLocaleString('es-CL')}
            </p>
          </div>

          {/* Card 6: Net Sales */}
          <div className="bg-card border-border/50 space-y-1 rounded-2xl border p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                Ventas Netas
              </span>
              <TrendingUp size={15} className="shrink-0 text-emerald-600" />
            </div>
            <p className="text-xl font-black tracking-tight text-emerald-600">
              ${summary.totalNetSales.toLocaleString('es-CL')}
            </p>
          </div>
        </div>

        {/* Filter Panel & Column Selector Toolbar */}
        <div className="bg-card border-border/50 space-y-4 rounded-3xl border p-5 shadow-xs">
          <div className="border-border/40 flex items-center justify-between border-b pb-3">
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="hover:text-primary flex cursor-pointer items-center gap-2 text-xs font-bold tracking-wide uppercase transition-colors"
            >
              <Filter size={16} className="text-primary" />
              <span>Filtros de Análisis</span>
              {isFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <div className="flex items-center gap-2">
              {/* Visible Columns Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                  className="bg-muted hover:bg-muted/80 border-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all"
                >
                  <Columns size={14} className="text-primary" />
                  <span>Columnas ({visibleColumns.length})</span>
                  <ChevronDown size={12} />
                </button>

                {/* Column Checkboxes Popover */}
                {isColumnsDropdownOpen && (
                  <div className="bg-card border-border/60 absolute top-10 right-0 z-30 max-h-80 w-64 space-y-2 overflow-y-auto rounded-2xl border p-3 shadow-xl select-none">
                    <div className="border-border/40 flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold uppercase">Columnas Visibles</span>
                      <button
                        type="button"
                        onClick={() => setIsColumnsDropdownOpen(false)}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {ALL_COLUMNS.map((colKey) => {
                        const isChecked = visibleColumns.includes(colKey)
                        return (
                          <label
                            key={colKey}
                            className="hover:bg-muted/60 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-xs transition-colors"
                          >
                            <span className="truncate pr-2">{COLUMN_LABELS[colKey]}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumn(colKey)}
                              className="accent-primary h-3.5 w-3.5 cursor-pointer rounded-xs"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 px-2 py-1.5 text-xs font-bold transition-colors"
              >
                <RefreshCw size={13} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          {isFiltersOpen && (
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 md:grid-cols-4">
              {/* Date From */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Desde (Fecha)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Hasta (Fecha)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Order Number */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Número de Pedido
                </label>
                <input
                  type="text"
                  placeholder="ej. #1042"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Customer Search */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Cliente (Nombre/Tel)
                </label>
                <input
                  type="text"
                  placeholder="ej. Luis / +569..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Cashier Selector */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Cajero / Operador
                </label>
                <select
                  value={cashierId}
                  onChange={(e) => setCashierId(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                >
                  <option value="">Todos los cajeros</option>
                  {cashiers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Status */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Estado Pedido
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                >
                  <option value="">Todos los estados</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="PREPARING">En Preparación</option>
                  <option value="READY">Listo para Retirar</option>
                  <option value="DELIVERED">Entregado / Completado</option>
                  <option value="CANCELLED">Anulado / Cancelado</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                >
                  <option value="">Todos los métodos</option>
                  <option value="SUMUP">SumUp</option>
                  <option value="CASH">Efectivo</option>
                  <option value="WEBPAY">Webpay</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>

              {/* Discount / Credit Search */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-[10px] font-bold uppercase">
                  Descuento / Convenio
                </label>
                <input
                  type="text"
                  placeholder="ej. Convenio Levitas"
                  value={discountSearch}
                  onChange={(e) => setDiscountSearch(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3 py-2 text-xs focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Interactive Data Table */}
        <div className="bg-card border-border/50 overflow-hidden rounded-3xl border shadow-xs">
          {isLoading && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-xs select-none">
              <Loader2 className="text-primary animate-spin" size={20} />
              <span>Cargando reporte de ventas...</span>
            </div>
          )}

          {errorMsg && !isLoading && (
            <div className="space-y-2 p-8 text-center text-xs text-red-500">
              <p className="font-bold">Error al cargar datos</p>
              <p>{errorMsg}</p>
            </div>
          )}

          {!isLoading && !errorMsg && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-3 p-16 text-center">
              <Search className="text-muted-foreground/50 h-8 w-8 stroke-[1.5]" />
              <p className="text-muted-foreground text-xs font-semibold">
                No se encontraron ventas para los criterios de filtro seleccionados.
              </p>
            </div>
          )}

          {!isLoading && !errorMsg && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* Table Header */}
                <thead className="bg-muted/60 border-border/40 text-muted-foreground border-b text-[11px] font-extrabold tracking-wider uppercase select-none">
                  <tr>
                    {visibleColumns.map((colKey) => {
                      const isSorted = sortBy === colKey
                      return (
                        <th
                          key={colKey}
                          onClick={() => handleSort(colKey)}
                          className="hover:text-foreground cursor-pointer px-4 py-3.5 whitespace-nowrap transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{COLUMN_LABELS[colKey]}</span>
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp size={13} className="text-primary" />
                              ) : (
                                <ArrowDown size={13} className="text-primary" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="opacity-40" />
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-border/30 divide-y">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {visibleColumns.map((colKey) => {
                        const rawVal = (row as unknown as Record<string, unknown>)[colKey]
                        let content: React.ReactNode = rawVal as React.ReactNode

                        // Format currencies & numbers
                        if (
                          [
                            'unitPrice',
                            'subtotal',
                            'discountAmount',
                            'creditUsed',
                            'grossAmount',
                            'orderDiscount',
                            'totalPaid',
                            'voidAmount',
                          ].includes(colKey)
                        ) {
                          const val = Number(rawVal || 0)
                          content = (
                            <span className="font-mono font-bold">
                              ${val.toLocaleString('es-CL')}
                            </span>
                          )
                        } else if (colKey === 'createdAt' && rawVal) {
                          content = new Date(rawVal as string | number | Date).toLocaleString(
                            'es-CL'
                          )
                        } else if (colKey === 'orderNumber') {
                          content = (
                            <span className="text-foreground font-extrabold">
                              #{String(content).replace(/^#/, '')}
                            </span>
                          )
                        } else if (colKey === 'voidStatus') {
                          const voidVal = String(content)
                          const color =
                            voidVal === 'Venta Anulada' || voidVal === 'Devolución Total'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : voidVal === 'Devolución Parcial'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          content = (
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${color}`}
                            >
                              {voidVal}
                            </span>
                          )
                        }

                        return (
                          <td key={colKey} className="px-4 py-3 whitespace-nowrap">
                            {content ?? '-'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!isLoading && !errorMsg && rows.length > 0 && (
            <div className="border-border/40 bg-muted/20 flex items-center justify-between border-t px-5 py-3 text-xs select-none">
              <span className="text-muted-foreground font-semibold">
                Mostrando {rows.length} de {totalRows} registros
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="bg-card hover:bg-muted border-border/60 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="px-2 font-extrabold">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="bg-card hover:bg-muted border-border/60 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Save Template Modal ──────────────────────────────────────────────── */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSaveModalOpen(false)}
          />

          <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 w-full max-w-md space-y-4 overflow-hidden rounded-3xl border p-6 shadow-2xl select-none">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
                <Bookmark size={18} className="text-primary" />
                Guardar Configuración como Plantilla
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ventas Mensuales Sucursal Centro"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Descripción corta del objetivo de esta plantilla..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={templateIsShared}
                  onChange={(e) => setTemplateIsShared(e.target.checked)}
                  className="accent-primary h-4 w-4 cursor-pointer rounded-xs"
                />
                <span className="text-foreground text-xs font-semibold">
                  Compartir plantilla con otros usuarios de la organización
                </span>
              </label>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="border-border/60 text-foreground hover:bg-muted w-full cursor-pointer rounded-xl border py-2.5 text-xs font-bold uppercase transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase shadow-md transition-all disabled:opacity-60"
                >
                  {isSavingTemplate ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <span>GUARDAR</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Manage Templates Modal ───────────────────────────────────────────── */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsTemplatesModalOpen(false)}
          />

          <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 w-full max-w-lg space-y-4 overflow-hidden rounded-3xl border p-6 shadow-2xl select-none">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
                <Bookmark size={18} className="text-primary" />
                Mis Plantillas Guardadas
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-muted-foreground space-y-2 p-8 text-center">
                <p className="text-xs font-semibold">No tienes plantillas guardadas aún.</p>
                <p className="text-[11px]">
                  Configura tus filtros y columnas en pantalla y presiona &quot;Guardar como
                  plantilla&quot;.
                </p>
              </div>
            ) : (
              <div className="divide-border/40 max-h-96 space-y-1 divide-y overflow-y-auto">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="hover:bg-muted/40 flex items-center justify-between rounded-xl px-2 py-3 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold">{tpl.name}</span>
                        {tpl.isShared && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase">
                            Compartida
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="text-muted-foreground text-[11px]">{tpl.description}</p>
                      )}
                      <p className="text-muted-foreground/70 text-[10px]">
                        {tpl.configuration?.visibleColumns?.length || 0} columnas visibles
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-bold shadow-xs transition-all"
                      >
                        Cargar
                      </button>

                      {tpl.userId === userId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                          title="Eliminar plantilla"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
