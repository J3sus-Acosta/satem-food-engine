'use client'

import React from 'react'
import { OrderTicket } from './OrderTicket'
import type { OrderWithItems } from '@/types'

interface KitchenColumnProps {
  title: string
  subtitle: string
  colorClass: string
  orders: OrderWithItems[]
  onAction: (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'COMPLETED') => Promise<void>
  onPrint?: (order: OrderWithItems) => void
}

export function KitchenColumn({
  title,
  subtitle,
  colorClass,
  orders,
  onAction,
  onPrint,
}: KitchenColumnProps) {
  return (
    <div className="border-border/30 flex h-[calc(100vh-140px)] min-h-[450px] flex-col rounded-3xl border bg-zinc-50/40 dark:bg-zinc-950/20">
      {/* Column Header */}
      <div className="border-border/40 flex shrink-0 items-center justify-between border-b p-4 select-none">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
          <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
          <span className="text-muted-foreground text-[10px] font-semibold">({subtitle})</span>
        </div>

        <span className="bg-muted text-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-black">
          {orders.length}
        </span>
      </div>

      {/* Ticket List Area */}
      <div className="flex-1 scrollbar-thin space-y-4 overflow-y-auto p-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderTicket key={order.id} order={order} onAction={onAction} onPrint={onPrint} />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center select-none">
            <p className="text-muted-foreground/60 text-xs">Sin pedidos en esta fila</p>
          </div>
        )}
      </div>
    </div>
  )
}
