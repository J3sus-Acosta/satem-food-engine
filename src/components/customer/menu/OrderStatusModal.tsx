'use client'

import React, { useState } from 'react'
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  PackageSearch,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChefHat,
} from 'lucide-react'
import type { PublicOrderStatusResult } from '@/types'

interface OrderStatusModalProps {
  locationId: string
  isOpen: boolean
  onClose: () => void
}

export function OrderStatusModal({ locationId, isOpen, onClose }: OrderStatusModalProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<PublicOrderStatusResult[]>([])

  if (!isOpen) return null

  const handleReset = () => {
    setOrderNumber('')
    setPhone('')
    setErrorMsg('')
    setHasSearched(false)
    setResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const cleanNum = orderNumber.trim()
    const cleanPhone = phone.trim()

    if (!cleanNum && !cleanPhone) {
      setErrorMsg('Debe ingresar un número de pedido o número de teléfono.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/orders/status-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          orderNumber: cleanNum || undefined,
          phone: cleanPhone || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al consultar el estado.')
      }

      setResults(json.data || [])
      setHasSearched(true)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorMsg(error.message || 'Error inesperado al buscar tu pedido.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
      case 'PREPARING':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/30'
      case 'CONFIRMED':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30'
      case 'PENDING':
      default:
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl">
        {/* Header */}
        <div className="border-border/60 flex items-center justify-between border-b p-5 select-none md:p-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
              <PackageSearch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight md:text-lg">
                Consultar Estado del Pedido
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-muted text-muted-foreground cursor-pointer rounded-xl p-2 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[80vh] overflow-y-auto p-5 md:p-6">
          {!hasSearched ? (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1 select-none">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Ingresa una de las siguientes opciones para verificar el progreso de tu pedido en
                  nuestra cocina:
                </p>
              </div>

              {errorMsg && (
                <div className="text-destructive bg-destructive/10 border-destructive/20 flex items-center gap-2 rounded-xl border p-3.5 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="orderNumber"
                    className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                  >
                    Número de pedido
                  </label>
                  <input
                    id="orderNumber"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ej: #1042"
                    disabled={isLoading}
                    className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 w-full rounded-xl border p-3.5 text-xs focus:ring-0 focus:outline-none md:text-sm"
                  />
                </div>

                <div className="relative flex items-center justify-center select-none">
                  <div className="bg-border/60 h-[1px] w-full" />
                  <span className="bg-card text-muted-foreground/70 absolute px-3 text-[10px] font-bold tracking-wider uppercase">
                    O
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                  >
                    Número de teléfono
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +56912345678"
                    disabled={isLoading}
                    className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 w-full rounded-xl border p-3.5 text-xs focus:ring-0 focus:outline-none md:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold tracking-wider uppercase shadow-md transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>CONSULTAR</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {results.length === 0 ? (
                /* Empty state */
                <div className="bg-muted/20 border-border/60 flex flex-col items-center justify-center space-y-3 rounded-2xl border p-8 text-center select-none">
                  <div className="bg-muted text-muted-foreground/60 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <PackageSearch size={28} />
                  </div>
                  <h4 className="text-sm font-bold">No encontramos pedidos activos</h4>
                  <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
                    No encontramos pedidos activos asociados a los datos ingresados.
                  </p>
                </div>
              ) : (
                /* Found Active Orders */
                <div className="space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      Pedidos Activos en Cocina ({results.length})
                    </span>
                  </div>

                  {results.map((order, idx) => (
                    <div
                      key={`${order.orderNumber}-${idx}`}
                      className="border-border/60 bg-card space-y-4 rounded-2xl border p-5 shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="border-border/40 flex items-center justify-between border-b pb-3.5">
                        <div>
                          <span className="text-foreground text-lg font-black tracking-tight">
                            #{order.orderNumber}
                          </span>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
                            <Clock size={12} />
                            <span>
                              {new Date(order.createdAt).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${getStatusBadgeStyle(
                            order.status
                          )}`}
                        >
                          {order.statusLabel}
                        </span>
                      </div>

                      {/* Description notice */}
                      <div className="bg-muted/40 border-border/40 flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed">
                        <ChefHat className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-foreground/90 font-medium">{order.statusDescription}</p>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 pt-1">
                        <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase select-none">
                          Detalle del Pedido
                        </span>
                        <div className="bg-muted/20 border-border/40 divide-border/30 divide-y rounded-xl border">
                          {order.items.map((item, iIdx) => (
                            <div
                              key={`${item.name}-${iIdx}`}
                              className="flex items-center justify-between p-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="text-foreground font-bold">{item.name}</span>
                                {item.modifiers.length > 0 && (
                                  <p className="text-muted-foreground text-[10px]">
                                    {item.modifiers.join(', ')}
                                  </p>
                                )}
                              </div>
                              <span className="bg-card border-border/60 text-foreground rounded-lg border px-2.5 py-1 text-xs font-black">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reset Action */}
              <button
                type="button"
                onClick={handleReset}
                className="border-border/60 text-foreground hover:bg-muted flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold tracking-wider uppercase transition-colors"
              >
                <RotateCcw size={14} />
                <span>NUEVA CONSULTA</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
