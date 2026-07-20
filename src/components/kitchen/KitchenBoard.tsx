'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, Laptop, History, Printer, RotateCcw, X, CheckCircle2 } from 'lucide-react'
import { KitchenColumn } from './KitchenColumn'
import { KitchenTicketPrinter } from './KitchenTicketPrinter'
import type { OrderWithItems, Order } from '@/types'

interface KitchenBoardProps {
  initialOrders: OrderWithItems[]
}

export function KitchenBoard({ initialOrders }: KitchenBoardProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState('')

  // Print & History Modal states
  const [activeTicketToPrint, setActiveTicketToPrint] = useState<OrderWithItems | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Format last updated time safely on client
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastUpdated(
        new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const fetchQueue = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/kitchen/orders')
      if (!res.ok) throw new Error('No se pudo sincronizar la cola de cocina')
      const result = await res.json()
      if (result.data) {
        setOrders(result.data)
        setLastUpdated(
          new Date().toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        )
        setErrorMsg('')
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorMsg(error.message || 'Error al conectar con la cocina.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Setup auto-polling every 10 seconds, clean on unmount
  useEffect(() => {
    const interval = setInterval(fetchQueue, 10000)
    return () => clearInterval(interval)
  }, [])

  // Process status transition (PREPARING, READY, COMPLETED)
  const handleStatusTransition = async (
    orderId: string,
    nextStatus: 'PREPARING' | 'READY' | 'COMPLETED'
  ) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'No se pudo actualizar la comanda en cocina.')
      }

      if (nextStatus === 'COMPLETED') {
        // Remove from board completely
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      } else {
        // Transition state locally
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId && result.data) {
              return result.data
            }
            return o
          })
        )
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Ocurrió un error al actualizar la cocina.')
    }
  }

  // Fetch History of delivered/completed orders
  const handleOpenHistoryModal = async () => {
    setIsHistoryModalOpen(true)
    setIsLoadingHistory(true)
    try {
      const res = await fetch('/api/kitchen/orders/history')
      if (!res.ok) throw new Error('No se pudo obtener el historial de comandas.')
      const result = await res.json()
      if (result.data) {
        setHistoryOrders(result.data)
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Error al cargar el historial.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Reopen an order that was marked delivered by error
  const handleReopenOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PREPARING' }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'No se pudo reactivar la comanda.')
      }

      // Re-sync active queue
      await fetchQueue()
      setIsHistoryModalOpen(false)
      alert(`¡Comanda reactivada! El pedido volvió a la columna "En Cocina".`)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Error al reactivar el pedido.')
    }
  }

  // Filter orders by columns
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED')
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* KDS Header bar */}
      <header className="border-border/40 bg-card sticky top-0 z-20 border-b py-4 shadow-sm select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
              <Laptop size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase md:text-base">
                Kitchen Display System
              </h1>
              <p className="text-muted-foreground text-[10px] leading-none font-semibold">
                Pantalla de Cocina Principal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {errorMsg && (
              <span className="text-destructive hidden animate-pulse text-[10px] font-bold sm:inline">
                {errorMsg}
              </span>
            )}

            {/* Link to POS */}
            <a
              href="/dashboard/pos"
              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors"
            >
              Caja POS
            </a>

            {/* History Modal Trigger */}
            <button
              onClick={handleOpenHistoryModal}
              className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <History size={14} className="text-primary" />
              Historial / Reactivar
            </button>

            <div className="text-right">
              <span className="text-muted-foreground block text-[9px] font-bold tracking-wider uppercase">
                Sincronización
              </span>
              <span className="text-foreground text-[11px] font-black">{lastUpdated}</span>
            </div>

            <button
              onClick={fetchQueue}
              disabled={isRefreshing}
              className="border-border hover:bg-muted text-muted-foreground hover:text-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={`${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board Grid */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Column 1: NUEVOS */}
          <KitchenColumn
            title="Nuevos"
            subtitle="Por preparar"
            colorClass="bg-primary"
            orders={confirmedOrders}
            onAction={handleStatusTransition}
            onPrint={(order) => setActiveTicketToPrint(order)}
          />

          {/* Column 2: EN PREPARACION */}
          <KitchenColumn
            title="En Cocina"
            subtitle="Preparando"
            colorClass="bg-amber-500"
            orders={preparingOrders}
            onAction={handleStatusTransition}
            onPrint={(order) => setActiveTicketToPrint(order)}
          />

          {/* Column 3: LISTOS */}
          <KitchenColumn
            title="Listos"
            subtitle="Por entregar"
            colorClass="bg-green-600"
            orders={readyOrders}
            onAction={handleStatusTransition}
            onPrint={(order) => setActiveTicketToPrint(order)}
          />
        </div>
      </main>

      {/* Thermal Ticket Printer Modal Component */}
      {activeTicketToPrint && (
        <KitchenTicketPrinter
          order={activeTicketToPrint}
          onClose={() => setActiveTicketToPrint(null)}
        />
      )}

      {/* History & Order Reopening Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-card border-border/60 flex max-h-[85vh] w-full max-w-2xl flex-col space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="text-primary h-5 w-5" />
                <div>
                  <h3 className="text-foreground text-base font-bold">
                    Historial de Pedidos Recientes
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Revisa o reactiva comandas entregadas por error
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-muted-foreground hover:bg-muted rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {isLoadingHistory ? (
                <div className="text-muted-foreground p-8 text-center text-xs font-semibold">
                  Cargando historial de pedidos...
                </div>
              ) : historyOrders.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center text-xs font-semibold">
                  No hay pedidos entregados o cancelados recientemente.
                </div>
              ) : (
                historyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-muted/30 border-border/50 flex items-center justify-between gap-4 rounded-2xl border p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-base font-black">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {order.status === 'DELIVERED' ? 'ENTREGADO' : 'CANCELADO'}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Total: ${Number(order.totalAmount).toLocaleString('es-CL')} —{' '}
                        {new Date(order.createdAt).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReopenOrder(order.id)}
                        className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/20"
                      >
                        <RotateCcw size={14} /> Volver a Preparación
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
