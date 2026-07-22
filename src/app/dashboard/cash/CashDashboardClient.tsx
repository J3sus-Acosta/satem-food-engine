/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  History,
  Save,
  X,
  Printer,
  Loader2,
  AlertCircle,
  TrendingUp,
  Package,
  Layers,
  Settings,
  DollarSign,
  CheckCircle2,
  Clock,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Key,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportResult } from '@/services'

interface CashDashboardClientProps {
  organizationId: string
  locationId: string
  locations: { id: string; name: string }[]
  users: { id: string; name: string; email: string | null; role: string }[]
  channels: { id: string; name: string }[]
}

export default function CashDashboardClient({
  organizationId,
  locationId: initialLocationId,
  locations,
  users,
  channels,
}: CashDashboardClientProps) {
  // Authentication & Simulation States
  const [currentUserEmail, setCurrentUserEmail] = useState('cajero@satem.cl')
  const [currentUserRole, setCurrentUserRole] = useState('CASHIER')
  const [currentLocationId, setCurrentLocationId] = useState(initialLocationId)

  // Current session data
  const [activeSession, setActiveSession] = useState<any | null>(null)
  const [activeReport, setActiveReport] = useState<ReportResult | null>(null)
  const [activeMovements, setActiveMovements] = useState<any[]>([])
  const [isCurrentLoading, setIsCurrentLoading] = useState(false)

  // History & Filter States
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyUserFilter, setHistoryUserFilter] = useState('all')

  // Selected session detail (Modal)
  const [selectedHistorySession, setSelectedHistorySession] = useState<any | null>(null)
  const [selectedSessionReport, setSelectedSessionReport] = useState<ReportResult | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Form Modals
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false)

  // Form Inputs
  const [openingBalance, setOpeningBalance] = useState<number | ''>('')
  const [registerName, setRegisterName] = useState('Caja Principal')
  const [closingBalance, setClosingBalance] = useState<number | ''>('')
  const [closingObservations, setClosingObservations] = useState('')
  const [movementAmount, setMovementAmount] = useState<number | ''>('')
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [movementReason, setMovementReason] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [reopenSessionId, setReopenSessionId] = useState('')

  // UX Alerts
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Tab configurations
  const [activeReportTab, setActiveReportTab] = useState<
    'totals' | 'channels' | 'payments' | 'products' | 'categories'
  >('totals')
  const [productSortBy, setProductSortBy] = useState<'qty' | 'amount' | 'name'>('qty')

  // Resolve current simulated operator
  const activeUserObj = users.find((u) => u.email === currentUserEmail) || users[0]

  // Fetch Current Session & Report
  const fetchCurrentSession = useCallback(async () => {
    setIsCurrentLoading(true)
    setGlobalError(null)
    try {
      const res = await fetch(
        `/api/catalog/cash/session/current?locationId=${currentLocationId}&userEmail=${currentUserEmail}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al obtener turno activo')

      if (json.data) {
        setActiveSession(json.data.session)
        setActiveReport(json.data.report)
        setActiveMovements(json.data.movements)
      } else {
        setActiveSession(null)
        setActiveReport(null)
        setActiveMovements([])
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Error al cargar estado de caja')
    } finally {
      setIsCurrentLoading(false)
    }
  }, [currentLocationId, currentUserEmail])

  // Fetch History
  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      let url = `/api/catalog/cash/session/history?locationId=${currentLocationId}`
      if (historyUserFilter !== 'all') {
        url += `&userId=${historyUserFilter}`
      }
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al obtener historial')
      setHistory(json.data || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [currentLocationId, historyUserFilter])

  useEffect(() => {
    fetchCurrentSession()
    fetchHistory()
  }, [fetchCurrentSession, fetchHistory])

  // Actions
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (openingBalance === '') return
    setIsActionLoading(true)
    setGlobalError(null)
    try {
      const res = await fetch('/api/catalog/cash/session/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingBalance: Number(openingBalance),
          registerName,
          locationId: currentLocationId,
          operatorEmail: currentUserEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al abrir caja')

      setSuccessMessage('El turno de caja ha sido abierto exitosamente')
      setOpeningBalance('')
      setIsOpenModalOpen(false)
      fetchCurrentSession()
      fetchHistory()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession || movementAmount === '' || !movementReason.trim()) return
    setIsActionLoading(true)
    setGlobalError(null)
    try {
      const res = await fetch('/api/catalog/cash/session/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          amount: Number(movementAmount),
          type: movementType,
          reason: movementReason,
          operatorEmail: currentUserEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al registrar movimiento')

      setSuccessMessage('Movimiento manual de caja registrado con éxito')
      setMovementAmount('')
      setMovementReason('')
      setIsMovementModalOpen(false)
      fetchCurrentSession()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession || closingBalance === '') return
    setIsActionLoading(true)
    setGlobalError(null)
    try {
      const res = await fetch('/api/catalog/cash/session/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          closingBalance: Number(closingBalance),
          observations: closingObservations,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cerrar caja')

      setSuccessMessage('El turno de caja ha sido cerrado exitosamente. Reporte consolidado.')
      setClosingBalance('')
      setClosingObservations('')
      setIsCloseModalOpen(false)
      fetchCurrentSession()
      fetchHistory()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReopenSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reopenSessionId || !reopenReason.trim()) return
    setIsActionLoading(true)
    setGlobalError(null)
    try {
      const res = await fetch('/api/catalog/cash/session/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: reopenSessionId,
          reason: reopenReason,
          reopenedByEmail: currentUserEmail,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al reabrir caja')

      setSuccessMessage('El turno de caja ha sido reabierto con éxito')
      setReopenReason('')
      setIsReopenModalOpen(false)
      fetchCurrentSession()
      fetchHistory()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const viewSessionDetails = async (sessionObj: any) => {
    setSelectedHistorySession(sessionObj)
    setSelectedSessionReport(null)
    setIsLoadingDetails(true)
    try {
      // If session is closed, its snapshot is inside closingReportSnapshot
      if (sessionObj.closingReportSnapshot) {
        setSelectedSessionReport(sessionObj.closingReportSnapshot)
      } else {
        // If it's open, fetch dynamic report bounds
        const res = await fetch(
          `/api/catalog/cash/report?locationId=${currentLocationId}&sessionId=${sessionObj.id}&operatorEmail=${currentUserEmail}`
        )
        const json = await res.json()
        if (res.ok && json.data) {
          setSelectedSessionReport(json.data)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Helper calculation for Cash Operators
  const activeMovementsIn = activeMovements
    .filter((m) => m.type === 'IN')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const activeMovementsOut = activeMovements
    .filter((m) => m.type === 'OUT')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const activePaidCash = activeReport?.payments.find((p) => p.method === 'CASH')?.amount || 0
  const expectedCashBalance = activeSession
    ? Number(activeSession.openingBalance) + activePaidCash + activeMovementsIn - activeMovementsOut
    : 0

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Simulation Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
          <Key className="h-4 w-4" />
          <span>SIMULACIÓN DE SEGURIDAD Y PERMISOS:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-blue-700">Simular Rol:</span>
            <select
              value={currentUserEmail}
              onChange={(e) => {
                const mail = e.target.value
                setCurrentUserEmail(mail)
                const u = users.find((usr) => usr.email === mail)
                if (u) setCurrentUserRole(u.role)
              }}
              className="rounded-lg border border-blue-200 bg-white p-1.5 text-xs font-semibold text-slate-700 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.email || ''}>
                  {u.name} ({u.role === 'ADMIN' ? 'Administrador' : 'Cajero'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-blue-700">Sucursal:</span>
            <select
              value={currentLocationId}
              onChange={(e) => setCurrentLocationId(e.target.value)}
              className="rounded-lg border border-blue-200 bg-white p-1.5 text-xs font-semibold text-slate-700 outline-none"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3">
        <a
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/menu"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
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

      {/* Main Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control y Cierre de Caja
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona aperturas, arqueos de efectivo, retiros y conciliaciones por métodos de pago.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <Button
              onClick={() => {
                window.open(
                  `/dashboard/cash/print?sessionId=${activeSession.id}&operatorEmail=${currentUserEmail}`,
                  '_blank'
                )
              }}
              variant="outline"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" /> Imprimir Parcial
            </Button>
          )}
          <Button
            onClick={() => fetchCurrentSession()}
            disabled={isCurrentLoading}
            variant="outline"
            className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-500 ${isCurrentLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="animate-in fade-in slide-in-from-top mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {globalError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      {/* SECTION 1: ACTIVE CASH SESSION BANNER */}
      {isCurrentLoading ? (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-2 text-xs text-slate-400">Verificando estado del turno de caja...</p>
        </div>
      ) : !activeSession ? (
        <div className="border-slate-350 mb-8 rounded-xl border border-dashed bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-800">Caja Cerrada</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            No tienes un turno de caja activo en esta sucursal. Debes abrir la caja para registrar
            transacciones y cobros.
          </p>
          <Button
            onClick={() => setIsOpenModalOpen(true)}
            className="hover:bg-slate-850 mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Abrir Turno de Caja
          </Button>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Status Box */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-450 text-xs font-bold tracking-wider uppercase">
                  Turno Activo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> ABIERTA
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-slate-850 text-lg font-extrabold">
                  {activeSession.registerName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>
                    Cajero:{' '}
                    <strong className="font-semibold text-slate-700">{activeUserObj?.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Apertura: {new Date(activeSession.openedAt).toLocaleTimeString('es-CL')} (
                    {new Date(activeSession.openedAt).toLocaleDateString('es-CL')})
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                onClick={() => setIsMovementModalOpen(true)}
                variant="outline"
                className="w-full rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Movimiento Manual
              </Button>
              <Button
                onClick={() => setIsCloseModalOpen(true)}
                className="w-full rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                Realizar Cierre
              </Button>
            </div>
          </div>

          {/* Quick Cash Flow Numbers */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h4 className="text-slate-450 mb-4 text-xs font-bold tracking-wider uppercase">
              Flujo de Efectivo en Turno
            </h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border-r border-slate-100 pr-2">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Saldo Apertura
                </span>
                <span className="mt-1 block text-lg font-extrabold text-slate-700">
                  ${Number(activeSession.openingBalance).toLocaleString('es-CL')}
                </span>
              </div>
              <div className="border-r border-slate-100 pr-2">
                <span className="block flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" /> Ingresos (IN)
                </span>
                <span className="mt-1 block text-lg font-extrabold text-slate-700">
                  ${activeMovementsIn.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="border-r border-slate-100 pr-2">
                <span className="block flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase">
                  <ArrowDownRight className="h-3 w-3 text-rose-500" /> Egresos (OUT)
                </span>
                <span className="mt-1 block text-lg font-extrabold text-slate-700">
                  ${activeMovementsOut.toLocaleString('es-CL')}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Efectivo Esperado
                </span>
                <span className="mt-1 block text-lg font-extrabold text-emerald-700">
                  ${expectedCashBalance.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
              <span>
                Pedidos Turno:{' '}
                <strong className="text-slate-800">
                  {activeReport?.metadata.ordersCount || 0}
                </strong>
              </span>
              <span>•</span>
              <span>
                Clientes:{' '}
                <strong className="text-slate-800">
                  {activeReport?.metadata.customersCount || 0}
                </strong>
              </span>
              <span>•</span>
              <span>
                Total Vendido (Ventas):{' '}
                <strong className="text-slate-800">
                  ${activeReport?.totals.totalSales.toLocaleString('es-CL') || 0}
                </strong>
              </span>
              <span>•</span>
              <span>
                Total Recaudado (Pagado):{' '}
                <strong className="text-emerald-700">
                  ${activeReport?.totals.totalCollected.toLocaleString('es-CL') || 0}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CONSOLIDATED SESSION REPORT (Only if session is open) */}
      {activeSession && activeReport && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase">
              <TrendingUp className="h-4.5 w-4.5 text-slate-500" />
              Consolidado de Venta Actual del Turno
            </h3>
            {/* Tabs selector */}
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
              {[
                { id: 'totals', label: 'Totales' },
                { id: 'channels', label: 'Por Canales' },
                { id: 'payments', label: 'Por Pagos' },
                { id: 'products', label: 'Por Productos' },
                { id: 'categories', label: 'Por Categorías' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveReportTab(t.id as any)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    activeReportTab === t.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: TOTALS */}
          {activeReportTab === 'totals' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Ventas Brutas
                </span>
                <span className="mt-1 block text-base font-extrabold text-slate-700">
                  ${activeReport.totals.totalSales.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Neto</span>
                <span className="mt-1 block text-base font-extrabold text-slate-700">
                  ${activeReport.totals.netAmount.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  IVA (19%)
                </span>
                <span className="mt-1 block text-base font-extrabold text-slate-700">
                  ${activeReport.totals.taxAmount.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Descuentos
                </span>
                <span className="mt-1 block text-base font-extrabold text-rose-700">
                  -${activeReport.totals.discountAmount.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  Propinas
                </span>
                <span className="mt-1 block text-base font-extrabold text-slate-700">
                  ${activeReport.totals.tipAmount.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase">
                  Total Cobrado
                </span>
                <span className="mt-1 block text-base font-extrabold text-emerald-800">
                  ${activeReport.totals.totalCollected.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CHANNELS */}
          {activeReportTab === 'channels' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="text-slate-450 bg-slate-50 font-extrabold uppercase">
                  <tr>
                    <th className="p-3">Canal</th>
                    <th className="p-3 text-center">Pedidos</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-right">Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeReport.channels.map((ch, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{ch.channel}</td>
                      <td className="p-3 text-center">{ch.ordersCount}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        ${ch.amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-semibold text-blue-600">
                        {ch.percentage}%
                      </td>
                    </tr>
                  ))}
                  {activeReport.channels.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No hay ventas registradas en canales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeReportTab === 'payments' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="text-slate-450 bg-slate-50 font-extrabold uppercase">
                  <tr>
                    <th className="p-3">Método de Pago</th>
                    <th className="p-3 text-center">Transacciones</th>
                    <th className="p-3 text-right">Monto Recaudado</th>
                    <th className="p-3 text-right">Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeReport.payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{p.method}</td>
                      <td className="p-3 text-center">{p.paymentsCount}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        ${p.amount.toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600">
                        {p.percentage}%
                      </td>
                    </tr>
                  ))}
                  {activeReport.payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No hay cobros confirmados en caja aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PRODUCTS */}
          {activeReportTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-400">
                  Lista de productos vendidos (ordenado por más vendido)
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setProductSortBy('qty')}
                    variant="outline"
                    className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                      productSortBy === 'qty'
                        ? 'border-slate-300 bg-slate-100 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    Ordenar por Cantidad
                  </Button>
                  <Button
                    onClick={() => setProductSortBy('amount')}
                    variant="outline"
                    className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                      productSortBy === 'amount'
                        ? 'border-slate-300 bg-slate-100 font-bold'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    Ordenar por Monto
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="text-slate-450 bg-slate-50 font-extrabold uppercase">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Unidades</th>
                      <th className="p-3 text-right">Venta Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[...activeReport.products]
                      .sort((a, b) => {
                        if (productSortBy === 'qty') return b.quantity - a.quantity
                        if (productSortBy === 'amount') return b.amount - a.amount
                        return a.name.localeCompare(b.name)
                      })
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                          <td className="p-3 text-center font-mono">{p.quantity}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            ${p.amount.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    {activeReport.products.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                          No hay productos vendidos en este turno.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORIES */}
          {activeReportTab === 'categories' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="text-slate-450 bg-slate-50 font-extrabold uppercase">
                  <tr>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Venta Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeReport.categories.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">{cat.name}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        ${cat.amount.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))}
                  {activeReport.categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-slate-400 italic">
                        No hay categorías vendidas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: CLOSING SESSIONS HISTORY */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase">
              <History className="h-4.5 w-4.5 text-slate-500" />
              Historial de Cierres de Caja
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Ver y reabrir turnos anteriores de esta sucursal.
            </p>
          </div>
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cajero:</span>
            <select
              value={historyUserFilter}
              onChange={(e) => setHistoryUserFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white p-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">Todos los cajeros</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isHistoryLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="text-slate-350 mx-auto h-7 w-7 animate-spin" />
            <p className="mt-2 text-xs">Cargando historial...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="text-slate-450 bg-slate-50 font-extrabold uppercase">
                <tr>
                  <th className="p-3">Turno / Caja</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3">Apertura</th>
                  <th className="p-3">Cierre</th>
                  <th className="p-3 text-right">Saldo Apertura</th>
                  <th className="p-3 text-right">Saldo Arqueo</th>
                  <th className="p-3 text-right">Diferencia</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((s) => {
                  const diffVal = s.difference !== null ? Number(s.difference) : 0
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">
                        {s.registerName}
                        {s.reopenedAt && (
                          <span className="ml-1.5 rounded border border-amber-100 bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-700">
                            Reabierta
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{s.user?.name || '—'}</td>
                      <td className="p-3 font-mono">
                        {new Date(s.openedAt).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 font-mono">
                        {s.closedAt ? new Date(s.closedAt).toLocaleString('es-CL') : 'Abierto'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        ${Number(s.openingBalance).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {s.closingBalance !== null
                          ? `$${Number(s.closingBalance).toLocaleString('es-CL')}`
                          : '—'}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          diffVal < 0
                            ? 'text-rose-600'
                            : diffVal > 0
                              ? 'text-blue-600'
                              : 'text-slate-650'
                        }`}
                      >
                        {s.difference !== null
                          ? `${diffVal >= 0 ? '+' : ''}$${diffVal.toLocaleString('es-CL')}`
                          : '—'}
                      </td>
                      <td className="p-3 text-center">
                        {s.status === 'OPEN' ? (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Abierta
                          </span>
                        ) : (
                          <span className="bg-slate-150 rounded-full border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                            Cerrada
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            onClick={() => viewSessionDetails(s)}
                            variant="outline"
                            className="h-7 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Ver Reporte
                          </Button>
                          <Button
                            onClick={() => {
                              window.open(
                                `/dashboard/cash/print?sessionId=${s.id}&operatorEmail=${currentUserEmail}`,
                                '_blank'
                              )
                            }}
                            variant="outline"
                            className="h-7 rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          {s.status === 'CLOSED' && (
                            <Button
                              onClick={() => {
                                setReopenSessionId(s.id)
                                setReopenReason('')
                                setIsReopenModalOpen(true)
                              }}
                              disabled={currentUserRole !== 'ADMIN'}
                              title={
                                currentUserRole !== 'ADMIN'
                                  ? 'Solo administradores pueden reabrir'
                                  : 'Reabrir Caja'
                              }
                              className={`h-7 rounded-lg px-2.5 text-[11px] font-semibold text-white ${
                                currentUserRole === 'ADMIN'
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'cursor-not-allowed bg-slate-300 opacity-55'
                              }`}
                            >
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                      No hay cierres registrados en el historial de esta sucursal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: OPEN SESSION FORM */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase">Apertura de Turno</h3>
              <button
                onClick={() => setIsOpenModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleOpenSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Monto Inicial en Efectivo (Sencillo) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    value={openingBalance}
                    onChange={(e) =>
                      setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 50000"
                    className="text-slate-850 w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-7 text-xs outline-none focus:border-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Identificador de Caja
                </label>
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Ej: Caja Principal"
                  className="text-slate-850 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="hover:bg-slate-850 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                >
                  {isActionLoading ? 'Abriendo...' : 'Abrir Turno'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL MOVEMENT FORM */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase">
                Registrar Movimiento Manual
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddMovement} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('IN')}
                  className={`rounded-lg border py-2.5 text-xs font-bold transition-all ${
                    movementType === 'IN'
                      ? 'text-emerald-850 border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('OUT')}
                  className={`rounded-lg border py-2.5 text-xs font-bold transition-all ${
                    movementType === 'OUT'
                      ? 'text-rose-850 border-rose-300 bg-rose-50'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Egreso / Retiro (-)
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Monto *
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    value={movementAmount}
                    onChange={(e) =>
                      setMovementAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ej: 15000"
                    className="text-slate-850 w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-7 text-xs outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Motivo / Descripción *
                </label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ej: Pago de panadería de la esquina"
                  className="text-slate-850 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="hover:bg-slate-850 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                >
                  {isActionLoading ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CLOSE SESSION (Arqueo de Caja) */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-800 text-slate-800 uppercase">
                Cerrar Turno de Caja (Arqueo)
              </h3>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCloseSession} className="mt-4 space-y-4">
              <div className="border-slate-250/60 rounded-lg border bg-slate-50 p-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450">Sencillo Inicial:</span>
                  <span className="font-mono">
                    ${Number(activeSession.openingBalance).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-slate-450">Ingresos/Egresos Netos:</span>
                  <span className="font-mono">
                    ${(activeMovementsIn - activeMovementsOut).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-slate-450">Venta Efectivo en Turno:</span>
                  <span className="font-mono">${activePaidCash.toLocaleString('es-CL')}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-800">
                  <span>Efectivo Esperado en Caja:</span>
                  <span>${expectedCashBalance.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Efectivo Físico Real Contado *
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    value={closingBalance}
                    onChange={(e) =>
                      setClosingBalance(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Monto real contado en caja"
                    className="text-slate-850 w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-7 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Observaciones del Cierre / Turno
                </label>
                <textarea
                  value={closingObservations}
                  onChange={(e) => setClosingObservations(e.target.value)}
                  placeholder="Ej: Entrega a supervisor. Cuadratura perfecta."
                  rows={3}
                  className="text-slate-850 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-rose-650 rounded-lg px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  {isActionLoading ? 'Procesando...' : 'Cerrar Turno'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REOPEN SESSION FORM (Admin Only) */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
          <div className="animate-in zoom-in-95 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-amber-800 text-slate-800 uppercase">
                Reabrir Caja Cerrada
              </h3>
              <button
                onClick={() => setIsReopenModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleReopenSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase">
                  Motivo de Reapertura *
                </label>
                <textarea
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Justifica por qué estás reabriendo esta caja..."
                  rows={3}
                  className="text-slate-850 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
                >
                  {isActionLoading ? 'Reabriendo...' : 'Confirmar Reapertura'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DETALLES DE SESION DEL HISTORIAL */}
      {selectedHistorySession && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300">
          <div className="animate-in slide-in-from-right relative flex h-full w-full flex-col border-l border-slate-200 bg-white p-6 shadow-2xl duration-350 md:max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Resumen de Turno: {selectedHistorySession.registerName}
                </h2>
                <p className="text-slate-450 mt-1 text-xs">
                  Operador:{' '}
                  <strong className="font-semibold text-slate-700">
                    {selectedHistorySession.user?.name}
                  </strong>{' '}
                  • Apertura: {new Date(selectedHistorySession.openedAt).toLocaleString('es-CL')}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistorySession(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="text-slate-650 flex-1 space-y-6 overflow-y-auto pr-2 pb-6 text-xs">
              {isLoadingDetails ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : selectedSessionReport ? (
                <div className="space-y-6">
                  {/* General Arqueo Block */}
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                      Arqueo y Cuadratura
                    </h4>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="text-slate-450 block text-[10px] font-medium uppercase">
                          Sencillo Apertura
                        </span>
                        <span className="text-slate-750 mt-0.5 block text-sm font-bold">
                          ${Number(selectedHistorySession.openingBalance).toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] font-medium uppercase">
                          Efectivo Esperado
                        </span>
                        <span className="text-slate-750 mt-0.5 block text-sm font-bold">
                          $
                          {Number(selectedHistorySession.expectedBalance || 0).toLocaleString(
                            'es-CL'
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] font-medium uppercase">
                          Contado Físico
                        </span>
                        <span className="text-slate-750 mt-0.5 block text-sm font-bold">
                          $
                          {Number(selectedHistorySession.closingBalance || 0).toLocaleString(
                            'es-CL'
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] font-medium uppercase">
                          Diferencia Arqueo
                        </span>
                        <span
                          className={`mt-0.5 block text-sm font-extrabold ${
                            Number(selectedHistorySession.difference || 0) < 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          ${Number(selectedHistorySession.difference || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                    {selectedHistorySession.observations && (
                      <div className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500 italic">
                        Observaciones: &ldquo;{selectedHistorySession.observations}&rdquo;
                      </div>
                    )}
                    {selectedHistorySession.reopenedAt && (
                      <div className="border-amber-250 mt-2 rounded border bg-amber-50 p-2 text-amber-900">
                        <strong>Turno Reabierto por Administrador</strong> el{' '}
                        {new Date(selectedHistorySession.reopenedAt).toLocaleString('es-CL')}.<br />
                        Motivo: &ldquo;{selectedHistorySession.reopenedReason}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Totales Block */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                      Resumen General de Ventas
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          Venta Total
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-700">
                          ${selectedSessionReport.totals.totalSales.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          Neto
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-700">
                          ${selectedSessionReport.totals.netAmount.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          IVA
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-700">
                          ${selectedSessionReport.totals.taxAmount.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          Descuentos
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-rose-600">
                          -${selectedSessionReport.totals.discountAmount.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">
                          Total Cobrado
                        </span>
                        <span className="mt-0.5 block text-sm font-extrabold text-emerald-800">
                          ${selectedSessionReport.totals.totalCollected.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Channel & Payment Tables */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                        Ventas por Canal
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-left">
                          <thead className="text-slate-450 bg-slate-50 text-[9px] font-bold uppercase">
                            <tr>
                              <th className="p-2">Canal</th>
                              <th className="p-2 text-center">Cant.</th>
                              <th className="p-2 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedSessionReport.channels.map((ch, i) => (
                              <tr key={i}>
                                <td className="p-2 font-semibold text-slate-700">{ch.channel}</td>
                                <td className="p-2 text-center">{ch.ordersCount}</td>
                                <td className="p-2 text-right font-mono font-bold">
                                  ${ch.amount.toLocaleString('es-CL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                        Ventas por Método
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-left">
                          <thead className="text-slate-450 bg-slate-50 text-[9px] font-bold uppercase">
                            <tr>
                              <th className="p-2">Método</th>
                              <th className="p-2 text-center">Cant.</th>
                              <th className="p-2 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedSessionReport.payments.map((p, i) => (
                              <tr key={i}>
                                <td className="p-2 font-semibold text-slate-700">{p.method}</td>
                                <td className="p-2 text-center">{p.paymentsCount}</td>
                                <td className="p-2 text-right font-mono font-bold">
                                  ${p.amount.toLocaleString('es-CL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Top Products */}
                  <div>
                    <h4 className="mb-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                      Productos Vendidos
                    </h4>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-left">
                        <thead className="text-slate-450 bg-slate-50 text-[9px] font-bold uppercase">
                          <tr>
                            <th className="p-2">Producto</th>
                            <th className="p-2 text-center">Cantidad</th>
                            <th className="p-2 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedSessionReport.products.slice(0, 15).map((prod, i) => (
                            <tr key={i}>
                              <td className="p-2 font-semibold text-slate-700">{prod.name}</td>
                              <td className="p-2 text-center font-mono">{prod.quantity}</td>
                              <td className="p-2 text-right font-mono font-bold">
                                ${prod.amount.toLocaleString('es-CL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 italic">
                  No se pudo cargar el desglose del reporte.
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="mt-auto flex justify-between gap-3 border-t border-slate-200 bg-white pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(
                    `/api/catalog/cash/report/export?locationId=${currentLocationId}&sessionId=${selectedHistorySession.id}&operatorEmail=${currentUserEmail}`,
                    '_blank'
                  )
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedHistorySession(null)}
                className="hover:bg-slate-850 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white"
              >
                Cerrar Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
