/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Search,
  Lock,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ShieldCheck,
  PackageX,
  UserCheck,
} from 'lucide-react'
import type { OrderWithItems, OrderVoidRecord, VoidOrderResult } from '@/types'

interface VoidOrderModalProps {
  organizationId: string
  locationId: string
  cashierUserId: string
  cashierUserName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'SELECT_ORDER' | 'ADMIN_AUTH' | 'SELECT_ITEMS' | 'CONFIRM' | 'SUCCESS'

export function VoidOrderModal({
  organizationId,
  locationId,
  cashierUserId,
  cashierUserName,
  isOpen,
  onClose,
  onSuccess,
}: VoidOrderModalProps) {
  const [step, setStep] = useState<Step>('SELECT_ORDER')

  // Search & Order Selection
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  // Admin Credentials (temporary in component memory for execution call)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authorizedAdmin, setAuthorizedAdmin] = useState<{
    id: string
    name: string
    username: string
    role: string
  } | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Return Selection
  const [isFullVoid, setIsFullVoid] = useState(false)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')

  // Processing & Error
  const [isExecuting, setIsExecuting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successResult, setSuccessResult] = useState<VoidOrderResult | null>(null)

  const resetState = useCallback(() => {
    setStep('SELECT_ORDER')
    setSearchQuery('')
    setSelectedOrder(null)
    setAdminUsername('')
    setAdminPassword('')
    setAuthorizedAdmin(null)
    setIsFullVoid(false)
    setReturnQuantities({})
    setReason('')
    setErrorMsg('')
    setSuccessResult(null)
  }, [])

  const fetchOrders = useCallback(
    async (query: string) => {
      setIsSearching(true)
      setErrorMsg('')
      try {
        const url = `/api/pos/orders/search?locationId=${encodeURIComponent(
          locationId
        )}&q=${encodeURIComponent(query)}`
        const res = await fetch(url)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al buscar ventas')
        setOrders(json.data || [])
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'No se pudieron obtener las ventas.')
      } finally {
        setIsSearching(false)
      }
    },
    [locationId]
  )

  // Load recent orders when modal opens
  useEffect(() => {
    if (isOpen) {
      resetState()
      fetchOrders('')
    }
  }, [isOpen, locationId, resetState, fetchOrders])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(searchQuery)
  }

  const handleSelectOrder = (order: OrderWithItems) => {
    setSelectedOrder(order)
    setErrorMsg('')

    // Initialize quantities available for return
    const orderMetadata = (order.metadata as Record<string, unknown> | null) || {}
    const existingVoids = (orderMetadata.voids as OrderVoidRecord[] | undefined) || []

    const alreadyReturnedMap: Record<string, number> = {}
    for (const voidRecord of existingVoids) {
      for (const item of voidRecord.items) {
        alreadyReturnedMap[item.orderItemId] =
          (alreadyReturnedMap[item.orderItemId] || 0) + item.quantityReturned
      }
    }

    const initialQtys: Record<string, number> = {}
    for (const item of order.items) {
      const returned = alreadyReturnedMap[item.id] || 0
      const available = Math.max(0, item.quantity - returned)
      initialQtys[item.id] = available
    }

    setReturnQuantities(initialQtys)
    setIsFullVoid(true)
    setStep('ADMIN_AUTH')
  }

  const handleAuthorizeAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminUsername.trim() || !adminPassword) {
      setErrorMsg('Ingrese el usuario y contraseña del administrador.')
      return
    }

    setIsAuthenticating(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/pos/orders/void/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          usernameOrEmail: adminUsername,
          passwordInput: adminPassword,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Credenciales de administrador incorrectas.')
      }

      setAuthorizedAdmin(json.data)
      setStep('SELECT_ITEMS')
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Credenciales de administrador incorrectas.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const getAlreadyReturnedMap = (order: OrderWithItems) => {
    const orderMetadata = (order.metadata as Record<string, unknown> | null) || {}
    const existingVoids = (orderMetadata.voids as OrderVoidRecord[] | undefined) || []

    const map: Record<string, number> = {}
    for (const voidRecord of existingVoids) {
      for (const item of voidRecord.items) {
        map[item.orderItemId] = (map[item.orderItemId] || 0) + item.quantityReturned
      }
    }
    return map
  }

  // Calculate real-time refund total
  const calculateRefundTotal = () => {
    if (!selectedOrder) return 0
    const alreadyReturnedMap = getAlreadyReturnedMap(selectedOrder)
    const discountRatio =
      selectedOrder.subtotal > 0 ? selectedOrder.discountAmount / selectedOrder.subtotal : 0

    let total = 0
    for (const item of selectedOrder.items) {
      const returnedAlready = alreadyReturnedMap[item.id] || 0
      const available = item.quantity - returnedAlready
      const qtyToReturn = isFullVoid ? available : returnQuantities[item.id] || 0

      if (qtyToReturn > 0) {
        const itemNetPaidUnit = (item.subtotal / item.quantity) * (1 - discountRatio)
        total += Math.round(itemNetPaidUnit * qtyToReturn)
      }
    }
    return total
  }

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!reason.trim()) {
      setErrorMsg('Debe ingresar el motivo de la anulación.')
      return
    }

    const refundTotal = calculateRefundTotal()
    if (refundTotal <= 0) {
      setErrorMsg('Debe seleccionar al menos un producto a devolver.')
      return
    }

    setStep('CONFIRM')
  }

  const handleExecuteVoid = async () => {
    if (!selectedOrder || !authorizedAdmin) return

    setIsExecuting(true)
    setErrorMsg('')

    try {
      const alreadyReturnedMap = getAlreadyReturnedMap(selectedOrder)
      const itemsToReturnPayload = selectedOrder.items
        .map((item) => {
          const returnedAlready = alreadyReturnedMap[item.id] || 0
          const available = item.quantity - returnedAlready
          const qtyToReturn = isFullVoid ? available : returnQuantities[item.id] || 0
          return {
            orderItemId: item.id,
            quantityToReturn: qtyToReturn,
          }
        })
        .filter((i) => i.quantityToReturn > 0)

      const res = await fetch('/api/pos/orders/void/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          locationId,
          cashierUserId,
          adminUsernameOrEmail: adminUsername,
          adminPasswordInput: adminPassword,
          reason,
          itemsToReturn: itemsToReturnPayload,
          isFullVoid,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al ejecutar la anulación.')
      }

      setSuccessResult(json.data)
      setStep('SUCCESS')
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error inesperado al anular la venta.')
    } finally {
      setIsExecuting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={isExecuting ? undefined : onClose}
      />

      {/* Modal Dialog Container */}
      <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl">
        {/* Modal Header */}
        <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 font-bold text-rose-600 dark:text-rose-400">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight md:text-base">
                Anulación y Devolución de Ventas
              </h3>
              <p className="text-muted-foreground text-[11px]">
                Turno Cajero:{' '}
                <span className="text-foreground font-semibold">{cashierUserName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body depending on Step */}
        <div className="p-6">
          {errorMsg && (
            <div className="text-destructive bg-destructive/10 border-destructive/20 mb-4 flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SELECT ORDER */}
          {step === 'SELECT_ORDER' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Buscar Venta a Anular</h4>
                <p className="text-muted-foreground text-xs">
                  Ingrese el número de pedido (#1042) o notas para localizar la venta realizada en
                  este turno.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. 1042 o nombre cliente..."
                    className="border-border/60 bg-background focus:border-primary placeholder:text-muted-foreground/60 w-full rounded-xl border py-2.5 pr-3 pl-9 text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Buscar'}
                </button>
              </form>

              {/* Orders List */}
              <div className="divide-border/40 border-border/60 max-h-72 divide-y overflow-y-auto rounded-2xl border">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-muted-foreground p-8 text-center text-xs">
                    No se encontraron ventas para la búsqueda realizada.
                  </div>
                ) : (
                  orders.map((o) => {
                    const metadata = (o.metadata as Record<string, unknown> | null) || {}
                    const customerName = (metadata.customerName as string) || ''
                    const isCancelled = o.status === 'CANCELLED'

                    return (
                      <div
                        key={o.id}
                        onClick={() => (!isCancelled ? handleSelectOrder(o) : undefined)}
                        className={`flex items-center justify-between p-3.5 transition-colors ${
                          isCancelled
                            ? 'bg-muted/20 cursor-not-allowed opacity-50'
                            : 'hover:bg-muted/40 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black">#{o.orderNumber}</span>
                            {customerName && (
                              <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-[10px] font-bold">
                                {customerName}
                              </span>
                            )}
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isCancelled
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-emerald-500/10 text-emerald-600'
                              }`}
                            >
                              {isCancelled ? 'Anulada' : o.status}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            {new Date(o.createdAt).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {o.items.length} producto(s) •{' '}
                            <span className="font-semibold">
                              {o.payment?.provider || 'EFECTIVO'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold">
                            ${o.totalAmount.toLocaleString('es-CL')}
                          </span>
                          {!isCancelled && (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 2: ADMIN AUTHENTICATION */}
          {step === 'ADMIN_AUTH' && selectedOrder && (
            <form onSubmit={handleAuthorizeAdmin} className="space-y-5">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ShieldCheck size={16} />
                  <span>Autorización de Administrador Requerida</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Para anular la Venta{' '}
                  <span className="font-extrabold">#{selectedOrder.orderNumber}</span> por{' '}
                  <span className="font-extrabold">
                    ${selectedOrder.totalAmount.toLocaleString('es-CL')}
                  </span>
                  , un administrador debe autorizar con sus credenciales. La sesión del cajero se
                  mantendrá activa.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Usuario / Correo de Administrador
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Ej. admin@satem.cl o admin"
                    className="border-border/60 bg-background focus:border-primary w-full rounded-xl border p-3 text-xs focus:outline-none"
                    disabled={isAuthenticating}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    Contraseña de Administrador
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-border/60 bg-background focus:border-primary w-full rounded-xl border p-3 text-xs focus:outline-none"
                    disabled={isAuthenticating}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_ORDER')}
                  disabled={isAuthenticating}
                  className="hover:bg-muted text-muted-foreground rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Validando autorización...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Autorizar Operación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SELECT ITEMS TO RETURN & REASON */}
          {step === 'SELECT_ITEMS' && selectedOrder && authorizedAdmin && (
            <form onSubmit={handleProceedToConfirm} className="space-y-5">
              {/* Authorized Admin Badge */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <UserCheck size={16} />
                  <span>
                    Autorizado por: {authorizedAdmin.name} ({authorizedAdmin.role})
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase">Credencial Validada ✓</span>
              </div>

              {/* Mode Toggle: Full vs Partial */}
              <div className="border-border/60 bg-muted/20 flex items-center justify-between rounded-2xl border p-3">
                <div>
                  <span className="text-xs font-bold">Modo de Anulación</span>
                  <p className="text-muted-foreground text-[10px]">
                    Seleccione si desea anular la venta completa o realizar una devolución parcial
                    por productos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullVoid(!isFullVoid)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    isFullVoid
                      ? 'bg-rose-600 text-white'
                      : 'bg-muted text-foreground border-border/60 border'
                  }`}
                >
                  {isFullVoid ? 'Anulación Total Activa' : 'Devolución Parcial'}
                </button>
              </div>

              {/* Items Table */}
              <div className="border-border/60 max-h-60 overflow-y-auto rounded-2xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground text-[10px] font-bold uppercase">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Vendidos</th>
                      <th className="p-3 text-center">A Devolver</th>
                      <th className="p-3 text-right">Precio Un.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border/40 divide-y">
                    {selectedOrder.items.map((item) => {
                      const alreadyReturnedMap = getAlreadyReturnedMap(selectedOrder)
                      const returned = alreadyReturnedMap[item.id] || 0
                      const available = Math.max(0, item.quantity - returned)
                      const currentQty = returnQuantities[item.id] || 0

                      return (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold">
                            {item.name}
                            {returned > 0 && (
                              <span className="ml-2 text-[10px] font-normal text-amber-600 dark:text-amber-400">
                                ({returned} ya devuelto/s)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-center">
                            {isFullVoid ? (
                              <span className="font-mono font-bold text-rose-600">{available}</span>
                            ) : (
                              <div className="border-border/60 bg-background inline-flex items-center gap-1.5 rounded-lg border p-1 select-none">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReturnQuantities({
                                      ...returnQuantities,
                                      [item.id]: Math.max(0, currentQty - 1),
                                    })
                                  }
                                  disabled={currentQty <= 0}
                                  className="hover:bg-muted rounded px-1.5 py-0.5 font-bold disabled:opacity-30"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-mono font-bold">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReturnQuantities({
                                      ...returnQuantities,
                                      [item.id]: Math.min(available, currentQty + 1),
                                    })
                                  }
                                  disabled={currentQty >= available}
                                  className="hover:bg-muted rounded px-1.5 py-0.5 font-bold disabled:opacity-30"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            ${item.unitPrice.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Reason Input */}
              <div className="space-y-1">
                <label className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  Motivo / Observaciones de la Devolución *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Cliente devolvió producto por error en pedido..."
                  className="border-border/60 bg-background focus:border-primary w-full rounded-xl border p-3 text-xs focus:outline-none"
                />
              </div>

              {/* Total Summary Row */}
              <div className="border-border/60 flex items-center justify-between border-t pt-3">
                <div>
                  <span className="text-muted-foreground text-xs">Total Devolución Estimado</span>
                  {selectedOrder.discountAmount > 0 && (
                    <p className="text-muted-foreground text-[10px]">
                      (Ajustado proporcionalmente por descuento aplicado de $
                      {selectedOrder.discountAmount.toLocaleString('es-CL')})
                    </p>
                  )}
                </div>
                <span className="text-lg font-black text-rose-600">
                  ${calculateRefundTotal().toLocaleString('es-CL')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('ADMIN_AUTH')}
                  className="hover:bg-muted text-muted-foreground rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md"
                >
                  Revisar Confirmación
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION SUMMARY */}
          {step === 'CONFIRM' && selectedOrder && authorizedAdmin && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-base font-black text-rose-600">
                  Confirmar Anulación Definitiva
                </h4>
                <p className="text-muted-foreground text-xs">
                  Por favor revise el resumen antes de aplicar los cambios en caja e inventario.
                </p>
              </div>

              <div className="border-border/60 bg-muted/20 space-y-3 rounded-2xl border p-4 text-xs">
                <div className="border-border/40 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Venta a Anular:</span>
                  <span className="font-extrabold">#{selectedOrder.orderNumber}</span>
                </div>
                <div className="border-border/40 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Tipo de Operación:</span>
                  <span className="font-bold text-rose-600">
                    {isFullVoid ? 'ANULACIÓN TOTAL' : 'DEVOLUCIÓN PARCIAL'}
                  </span>
                </div>
                <div className="border-border/40 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Autorizado por Administrador:</span>
                  <span className="font-semibold">
                    {authorizedAdmin.name} ({authorizedAdmin.role})
                  </span>
                </div>
                <div className="border-border/40 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Realizado en Turno Cajero:</span>
                  <span className="font-semibold">{cashierUserName}</span>
                </div>
                <div className="border-border/40 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Motivo:</span>
                  <span className="font-medium italic">&quot;{reason}&quot;</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-black">
                  <span>Monto Total a Reembolsar:</span>
                  <span className="text-rose-600">
                    ${calculateRefundTotal().toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_ITEMS')}
                  disabled={isExecuting}
                  className="hover:bg-muted text-muted-foreground rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  Modificar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVoid}
                  disabled={isExecuting}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-black text-white shadow-lg hover:bg-rose-700 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Procesando anulación transaccional...</span>
                    </>
                  ) : (
                    <>
                      <PackageX size={16} />
                      <span>Confirmar y Ejecutar Anulación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'SUCCESS' && successResult && (
            <div className="space-y-6 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black tracking-tight">
                  ¡Anulación Efectuada Con Éxito!
                </h4>
                <p className="text-muted-foreground mx-auto max-w-sm text-xs">
                  La devolución ha sido procesada correctamente en la base de datos. Se ha
                  actualizado el turno de caja y se han restaurado los insumos en el inventario.
                </p>
              </div>

              <div className="border-border/60 bg-muted/30 inline-block rounded-2xl border p-4 font-mono text-xs">
                <div>
                  Devolución ID: <span className="font-bold">{successResult.voidRecord.id}</span>
                </div>
                <div>
                  Monto Reembolsado:{' '}
                  <span className="font-bold text-rose-600">
                    ${successResult.voidRecord.totalRefundAmount.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-8 py-3 text-xs font-bold shadow-md"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
