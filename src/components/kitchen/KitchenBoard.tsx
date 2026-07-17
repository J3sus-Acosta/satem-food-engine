'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw, Laptop } from 'lucide-react'
import { KitchenColumn } from './KitchenColumn'
import type { OrderWithItems } from '@/types'

interface KitchenBoardProps {
  initialOrders: OrderWithItems[]
}

export function KitchenBoard({ initialOrders }: KitchenBoardProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState('')

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

  // Process PATCH request to update statuses
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

      // Optimistic update / update local state directly
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
                MCI Santiago — KDS Principal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {errorMsg && (
              <span className="text-destructive hidden animate-pulse text-[10px] font-bold sm:inline">
                {errorMsg}
              </span>
            )}

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
          />

          {/* Column 2: EN PREPARACION */}
          <KitchenColumn
            title="En Cocina"
            subtitle="Preparando"
            colorClass="bg-amber-500"
            orders={preparingOrders}
            onAction={handleStatusTransition}
          />

          {/* Column 3: LISTOS */}
          <KitchenColumn
            title="Listos"
            subtitle="Por entregar"
            colorClass="bg-green-600"
            orders={readyOrders}
            onAction={handleStatusTransition}
          />
        </div>
      </main>
    </div>
  )
}
