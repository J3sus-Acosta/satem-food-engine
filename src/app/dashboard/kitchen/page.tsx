'use client'

import React, { useEffect, useState } from 'react'
import type { OrderWithItems } from '@/types'

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<number>(0)

  // Initialize client-side current time
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentTime(Date.now())
    }, 0)
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 10000)
    return () => {
      clearTimeout(timeout)
      clearInterval(timer)
    }
  }, [])

  // Fetch active kitchen orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/kitchen/orders')
      if (!res.ok) {
        throw new Error('No se pudo conectar con la API de cocina')
      }
      const json = await res.json()
      setOrders(json.data || [])
      setLastUpdated(new Date())
      setError(null)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Setup auto-polling every 5 seconds for real-time kitchen updates
  useEffect(() => {
    let active = true
    async function load() {
      const res = await fetch('/api/kitchen/orders')
      if (!res.ok) throw new Error('No se pudo conectar con la API de cocina')
      const json = await res.json()
      if (active) {
        setOrders(json.data || [])
        setLastUpdated(new Date())
        setError(null)
        setLoading(false)
      }
    }
    load().catch((err) => {
      if (active) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setLoading(false)
      }
    })

    const interval = setInterval(() => {
      load().catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error de sincronización')
        }
      })
    }, 5000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // Transition: DRAFT/CONFIRMED -> PREPARING
  const handleStartPreparing = async (orderId: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/prepare`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'No se pudo iniciar preparación')
      }
      await fetchOrders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al iniciar preparación')
    }
  }

  // Transition: PREPARING -> READY
  const handleMarkReady = async (orderId: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/ready`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'No se pudo marcar listo')
      }
      await fetchOrders()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al marcar listo')
    }
  }

  // Calculate elapsed time from creation in minutes (pure function)
  const getElapsedMins = (createdAtStr: string | Date, now: number) => {
    if (now === 0) return 0
    const created = new Date(createdAtStr)
    const diffMs = now - created.getTime()
    return Math.floor(diffMs / 60000)
  }

  // Filter orders by status
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED')
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-100 select-none">
      {/* Header bar */}
      <header className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
            SATEM Kitchen Dashboard 👨‍🍳
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Cola de preparación en tiempo real. Optimizado para pantallas táctiles.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          {error && (
            <span className="animate-pulse rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-400">
              ⚠️ {error}
            </span>
          )}
          <span className="text-slate-500">Actualizado: {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={fetchOrders}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-bold text-slate-200 transition-colors hover:bg-slate-700 active:scale-95"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

      {/* Main columns grid */}
      {loading && orders.length === 0 ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium">Cargando pedidos de cocina...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* COLUMN 1: NUEVOS PEDIDOS */}
          <div className="flex min-h-[75vh] flex-col rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-sky-400">
                📥 Nuevos Pedidos
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">
                  {confirmedOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
              {confirmedOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 italic">
                  No hay nuevos pedidos pendientes.
                </div>
              ) : (
                confirmedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    elapsedMins={getElapsedMins(order.createdAt, currentTime)}
                    onAction={() => handleStartPreparing(order.id)}
                    actionLabel="Comenzar preparación"
                    actionColor="bg-sky-600 hover:bg-sky-500 border-sky-500 text-white"
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: EN PREPARACIÓN */}
          <div className="flex min-h-[75vh] flex-col rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-amber-400">
                🔥 En Preparación
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                  {preparingOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
              {preparingOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 italic">
                  Ningún pedido se está preparando ahora.
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    elapsedMins={getElapsedMins(order.createdAt, currentTime)}
                    onAction={() => handleMarkReady(order.id)}
                    actionLabel="Marcar listo"
                    actionColor="bg-amber-600 hover:bg-amber-500 border-amber-500 text-white"
                  />
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: LISTOS */}
          <div className="flex min-h-[75vh] flex-col rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-400">
                ✅ Listos para Retiro
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                  {readyOrders.length}
                </span>
              </h2>
            </div>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
              {readyOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 italic">
                  No hay pedidos listos.
                </div>
              ) : (
                readyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    elapsedMins={getElapsedMins(order.createdAt, currentTime)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface OrderCardProps {
  order: OrderWithItems
  elapsedMins: number
  onAction?: () => void
  actionLabel?: string
  actionColor?: string
}

function OrderCard({ order, elapsedMins, onAction, actionLabel, actionColor }: OrderCardProps) {
  // Alert color depending on elapsed waiting time in kitchen
  const getElapsedBadgeColor = (mins: number) => {
    if (mins >= 15) return 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
    if (mins >= 8) return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    return 'bg-slate-800 border-slate-700 text-slate-300'
  }

  return (
    <div className="bg-slate-905 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl transition-all hover:border-slate-700">
      {/* Header of card */}
      <div className="flex items-start justify-between">
        <div>
          <span className="block text-2xl font-black tracking-tight text-slate-50">
            {order.orderNumber}
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Id: {order.id.slice(-6).toUpperCase()} • {order.type}
          </span>
        </div>
        <span
          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${getElapsedBadgeColor(elapsedMins)}`}
        >
          ⏱️ {elapsedMins} min
        </span>
      </div>

      {/* Client context / location identifier */}
      <div className="border-slate-850 rounded-lg border bg-slate-900/60 p-2 text-xs">
        <span className="block font-semibold text-slate-400">CONTEXTO:</span>
        <span className="mt-0.5 block font-bold text-slate-100">
          {order.tableIdentifier ? `📍 Mesa: ${order.tableIdentifier}` : '🚲 Retiro en Mostrador'}
        </span>
        {order.notes && (
          <div className="text-xxs mt-1.5 rounded border border-amber-500/20 bg-amber-500/10 p-1 font-medium text-amber-400 uppercase">
            📝 NOTA PEDIDO: {order.notes}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="my-1 flex flex-col gap-2.5">
        <span className="text-xxs font-bold tracking-wider text-slate-500 uppercase">
          ITEMS DEL PEDIDO:
        </span>
        <div className="flex flex-col gap-2 pl-1">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="border-b border-slate-900 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-extrabold text-slate-100">
                  <span className="mr-1.5 text-base text-emerald-400">{item.quantity}x</span>
                  {item.name}
                </span>
              </div>

              {/* Modifiers List (eg extra bacon, sin cebolla) */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 pl-5">
                  {item.modifiers.map((mod) => (
                    <span
                      key={mod.id}
                      className="text-xxs rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 font-bold tracking-wide text-rose-400 uppercase"
                    >
                      ➕ {mod.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Item notes */}
              {item.notes && (
                <div className="text-xxs mt-1 pl-5 text-amber-400 italic">
                  ⚠️ &quot;{item.notes}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer action button */}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className={`w-full rounded-xl border px-4 py-3.5 text-center text-base font-extrabold transition-all active:scale-[0.98] ${actionColor} mt-1`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
