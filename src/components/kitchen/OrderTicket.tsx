'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Play, Check, CheckCircle2 } from 'lucide-react'
import type { OrderWithItems } from '@/types'

interface OrderTicketProps {
  order: OrderWithItems
  onAction: (orderId: string, nextStatus: 'PREPARING' | 'READY' | 'COMPLETED') => Promise<void>
}

export function OrderTicket({ order, onAction }: OrderTicketProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate elapsed minutes since order creation
  useEffect(() => {
    const calculateElapsed = () => {
      const createdTime = new Date(order.createdAt).getTime()
      const diffMs = Date.now() - createdTime
      setElapsedMinutes(Math.floor(diffMs / 60000))
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [order.createdAt])

  // Determine elapsed time warning level
  const getElapsedColor = (minutes: number) => {
    if (minutes >= 20) return 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse'
    if (minutes >= 10) return 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-border/40'
  }

  // Extract customer details from metadata
  const metadata = (order.metadata as Record<string, unknown> | null) || {}
  const customerName = String(metadata.customerName || 'Cliente Invitado')
  const customerPhone = String(metadata.customerPhone || '')

  const handleButtonClick = async () => {
    setIsSubmitting(true)
    try {
      if (order.status === 'CONFIRMED') {
        await onAction(order.id, 'PREPARING')
      } else if (order.status === 'PREPARING') {
        await onAction(order.id, 'READY')
      } else if (order.status === 'READY') {
        await onAction(order.id, 'COMPLETED')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-card border-border/40 hover:border-border space-y-4 rounded-2xl border p-4 shadow-xs transition-all">
      {/* Header Info */}
      <div className="border-border/30 flex items-start justify-between border-b pb-3">
        <div>
          <span className="text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase">
            Retiro
          </span>
          <h4 className="text-lg font-black tracking-tight">#{order.orderNumber}</h4>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getElapsedColor(elapsedMinutes)}`}
        >
          <Clock size={11} className="shrink-0" />
          <span>{elapsedMinutes} min</span>
        </div>
      </div>

      {/* Customer details */}
      <div className="space-y-0.5 text-xs select-none">
        <p className="text-foreground font-extrabold">{customerName}</p>
        {customerPhone && <p className="text-muted-foreground text-[10px]">{customerPhone}</p>}
      </div>

      {/* Products and Modifiers list */}
      <div className="divide-border/20 divide-y py-1">
        {order.items.map((item, idx) => (
          <div key={item.id || idx} className="py-2.5 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="bg-muted text-foreground flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black">
                  {item.quantity}
                </span>
                <span className="text-foreground/90 font-bold">{item.name}</span>
              </div>
            </div>
            {item.modifiers.length > 0 && (
              <p className="text-muted-foreground mt-0.5 pl-6 text-[10px] select-none">
                + {item.modifiers.map((m) => m.name).join(', ')}
              </p>
            )}
            {item.notes && (
              <p className="mt-1 pl-6 text-[10px] font-bold text-rose-500 italic select-none dark:text-rose-400">
                &quot;{item.notes}&quot;
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={handleButtonClick}
        disabled={isSubmitting}
        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-center text-xs font-bold tracking-wide uppercase shadow-xs transition-all ${
          order.status === 'CONFIRMED'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : order.status === 'PREPARING'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-green-600 text-white hover:bg-green-700'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {order.status === 'CONFIRMED' && (
          <>
            <Play size={13} fill="currentColor" />
            <span>Iniciar Preparación</span>
          </>
        )}
        {order.status === 'PREPARING' && (
          <>
            <Check size={14} className="stroke-[3]" />
            <span>Marcar Listo</span>
          </>
        )}
        {order.status === 'READY' && (
          <>
            <CheckCircle2 size={13} className="stroke-[2.5]" />
            <span>Entregar Pedido</span>
          </>
        )}
      </button>
    </div>
  )
}
