'use client'

import React, { useEffect } from 'react'
import type { OrderWithItems } from '@/types'
import { Printer, X } from 'lucide-react'

interface KitchenTicketPrinterProps {
  order: OrderWithItems
  locationName?: string
  onClose?: () => void
  autoPrint?: boolean
}

export function KitchenTicketPrinter({
  order,
  locationName = 'SATEM Food Engine',
  onClose,
  autoPrint = true,
}: KitchenTicketPrinterProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  const handlePrint = () => {
    window.print()
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const orderTypeLabel =
    order.type === 'DINE_IN'
      ? 'COMER EN LOCAL'
      : order.type === 'TAKEAWAY'
        ? 'PARA LLEVAR'
        : 'DELIVERY / DESPACHO'

  const metadata = (order.metadata as Record<string, unknown> | null) || {}
  const customerName = (metadata.customerName as string) || ''
  const customerPhone = (metadata.customerPhone as string) || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      {/* Print Action Bar Header (Hidden during print) */}
      <div className="bg-card border-border/60 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border shadow-2xl">
        <div className="border-border/40 bg-muted/30 flex items-center justify-between border-b p-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="text-primary h-5 w-5" />
            <h3 className="text-foreground text-sm font-bold">Comanda Térmica de Cocina</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold shadow-md transition-all active:scale-[0.98]"
            >
              <Printer size={14} /> Imprimir Ahora
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted rounded-xl p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="flex flex-1 justify-center overflow-y-auto bg-zinc-900/50 p-6 print:overflow-visible print:bg-white print:p-0">
          {/* Thermal Receipt Paper Card (80mm Standard Width = 300px) */}
          <div
            id="printable-thermal-ticket"
            className="thermal-receipt-container w-[300px] rounded-sm bg-white p-5 font-mono text-xs leading-tight text-black shadow-lg print:w-full print:p-0 print:text-black print:shadow-none"
          >
            {/* Header */}
            <div className="space-y-1 border-b border-dashed border-black/40 pb-3 text-center">
              <h2 className="text-base font-black tracking-tighter uppercase">{locationName}</h2>
              <p className="text-[10px] font-bold tracking-widest text-black/70">
                CONTROL DE COCINA
              </p>
              <div className="flex justify-between pt-1 text-[10px]">
                <span>{formattedDate}</span>
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Huge Order Number */}
            <div className="my-2 space-y-0.5 border-b-2 border-black py-3 text-center">
              <span className="block text-[10px] font-bold tracking-wider uppercase">
                NÚMERO DE COMANDA
              </span>
              <div className="text-4xl font-black tracking-tight">{order.orderNumber}</div>
              <div className="mt-1 inline-block rounded-sm bg-black px-2 py-0.5 text-[11px] font-extrabold tracking-wider text-white">
                [{orderTypeLabel}]
              </div>
            </div>

            {/* Customer & Table details */}
            {(customerName || order.tableIdentifier || order.notes) && (
              <div className="mb-2 space-y-0.5 border-b border-dashed border-black/40 pb-2 text-[11px]">
                {order.tableIdentifier && (
                  <div>
                    <span className="font-bold">MESA / ZONA:</span> {order.tableIdentifier}
                  </div>
                )}
                {customerName && (
                  <div>
                    <span className="font-bold">CLIENTE:</span> {customerName}{' '}
                    {customerPhone ? `(${customerPhone})` : ''}
                  </div>
                )}
                {order.notes && (
                  <div className="mt-1 rounded bg-black/5 p-1 font-bold">NOTA: {order.notes}</div>
                )}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3 py-1">
              <div className="flex justify-between border-b border-black pb-0.5 text-[10px] font-bold">
                <span>CANT. PRODUCTO</span>
                <span>SUBT.</span>
              </div>

              {(order.items || []).map((item) => {
                const itemSubtotal = Number(item.subtotal)
                return (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex items-start justify-between text-sm font-bold">
                      <span className="leading-tight">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="ml-2 text-xs whitespace-nowrap">
                        ${itemSubtotal.toLocaleString('es-CL')}
                      </span>
                    </div>

                    {/* Modifiers */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="space-y-0.5 pl-3 text-[11px] font-bold text-black/80">
                        {item.modifiers.map((mod) => (
                          <div key={mod.id}>+ {mod.name}</div>
                        ))}
                      </div>
                    )}

                    {/* Item Notes */}
                    {item.notes && (
                      <div className="pl-3 text-[10px] font-bold text-black/90 italic">
                        * {item.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="mt-3 space-y-1 border-t-2 border-black pt-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>SUBTOTAL</span>
                <span>${Number(order.subtotal).toLocaleString('es-CL')}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between font-bold">
                  <span>DESCUENTO</span>
                  <span>-${Number(order.discountAmount).toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-black pt-1 text-sm font-black">
                <span>TOTAL</span>
                <span>${Number(order.totalAmount).toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 space-y-0.5 border-t border-dashed border-black/40 pt-3 text-center text-[9px] font-bold text-black/70">
              <p>*** DOCUMENTO INTERNO DE CONTROL DE COCINA ***</p>
              <p>SATEM Food Engine Multi-Tenant System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Clean Thermal Receipt Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-thermal-ticket,
          #printable-thermal-ticket * {
            visibility: visible !important;
          }
          #printable-thermal-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
