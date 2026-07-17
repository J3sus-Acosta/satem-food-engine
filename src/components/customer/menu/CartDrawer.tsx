'use client'

import React, { useState } from 'react'
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useCustomerCart } from './CustomerCartProvider'
import { useCustomerOrder } from '../order/CustomerOrderProvider'
import { useRouter } from 'next/navigation'
import type { ApiResponse, OrderWithItems } from '@/types'

interface CartDrawerProps {
  locationId: string
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ locationId, isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, cartSubtotal, clearCart } = useCustomerCart()
  const { setOrder } = useCustomerOrder()
  const router = useRouter()

  // Staged states
  const [isEnteringDetails, setIsEnteringDetails] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  // Checkout Form states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [createdOrderNumber, setCreatedOrderNumber] = useState('')

  if (!isOpen) return null

  const handleConfirmOrder = () => {
    setIsEnteringDetails(true)
  }

  const handleBackToCart = () => {
    setIsEnteringDetails(false)
    setErrorMsg('')
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const name = customerName.trim()
    const phone = customerPhone.trim()

    if (!name) {
      setErrorMsg('El nombre es obligatorio.')
      return
    }
    if (!phone) {
      setErrorMsg('El teléfono es obligatorio.')
      return
    }

    setIsLoading(true)
    try {
      // Map frontend items payload to CreateCustomerOrderInput structure
      const checkoutPayload = {
        locationId,
        customerName: name,
        customerPhone: phone,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          modifiers: item.modifiers.map((m) => ({ modifierId: m.modifierId })),
          notes: item.notes || undefined,
        })),
      }

      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      })

      const result: ApiResponse<OrderWithItems> = await response.json()

      if (!response.ok || 'error' in result) {
        const errorMsg = 'error' in result ? result.error : 'Error al procesar el pedido'
        throw new Error(errorMsg)
      }

      if ('data' in result && result.data) {
        const orderData = result.data
        setOrder({
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          locationId: orderData.locationId,
          status: orderData.status,
        })
        clearCart()
        onClose()
        router.push(`/menu/track?id=${orderData.id}`)
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[CartDrawer.handleCheckoutSubmit] Checkout error:', error)
      setErrorMsg(error.message || 'Ocurrió un error inesperado al enviar el pedido.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setOrderConfirmed(false)
    setCustomerName('')
    setCustomerPhone('')
    setCreatedOrderNumber('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300"
        onClick={orderConfirmed ? handleSuccessClose : onClose}
      />

      {/* Drawer Panel */}
      <div className="bg-card text-foreground border-border/40 animate-slide-in relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-2xl">
        {orderConfirmed ? (
          /* Confirmation Success Screen */
          <div className="flex h-full flex-col items-center justify-center space-y-6 p-6 text-center select-none">
            <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
              <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xl font-extrabold tracking-tight">¡Pedido Recibido!</h3>
              <div className="bg-muted border-border/40 inline-block rounded-xl border px-4 py-2">
                <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                  Número de Retiro
                </span>
                <span className="text-foreground text-2xl font-black">#{createdOrderNumber}</span>
              </div>
              <p className="text-muted-foreground max-w-xs pt-2 text-xs leading-relaxed">
                Tu pedido se ha registrado exitosamente en la cocina. Conserva este número para
                retirar tu comida en el mostrador del local.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSuccessClose}
              className="bg-foreground text-background hover:bg-foreground/90 w-full max-w-xs cursor-pointer rounded-xl py-3.5 text-xs font-bold tracking-wider uppercase shadow-sm transition-all"
            >
              Cerrar y volver
            </button>
          </div>
        ) : isEnteringDetails ? (
          /* Customer Details Checkout Form */
          <form onSubmit={handleCheckoutSubmit} className="flex h-full flex-col justify-between">
            {/* Form Header */}
            <div>
              <div className="border-border/60 flex items-center justify-between border-b p-5 select-none md:p-6">
                <button
                  type="button"
                  onClick={handleBackToCart}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Volver</span>
                </button>
                <h3 className="text-sm font-extrabold tracking-wide uppercase">Mis Datos</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:bg-muted text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Input fields body */}
              <div className="space-y-5 p-5 md:p-6">
                <div className="space-y-1.5 select-none">
                  <h4 className="text-sm font-bold md:text-base">Datos de Entrega</h4>
                  <p className="text-muted-foreground text-xs">
                    Ingresa tus datos para identificarte al momento de retirar tu pedido en el Food
                    Truck.
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-destructive bg-destructive/5 flex items-center gap-1.5 rounded-lg p-3 text-xs">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="customerName"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      Tu Nombre
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 w-full rounded-xl border p-3.5 text-xs focus:ring-0 focus:outline-none md:text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="customerPhone"
                      className="text-muted-foreground text-xs font-bold tracking-wider uppercase"
                    >
                      Teléfono de Contacto
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej: +56912345678"
                      className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 w-full rounded-xl border p-3.5 text-xs focus:ring-0 focus:outline-none md:text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations and Form submit footer */}
            <div className="bg-muted/30 border-border flex shrink-0 flex-col gap-4 border-t p-5 md:p-6">
              <div className="flex items-center justify-between select-none">
                <span className="text-muted-foreground text-xs font-semibold">Total a pagar</span>
                <span className="text-foreground text-lg font-extrabold">
                  ${cartSubtotal.toLocaleString('es-CL')}
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-center text-xs font-bold tracking-wide uppercase shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Enviando pedido...</span>
                  </>
                ) : (
                  <span>Enviar Pedido a Cocina</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Cart Review View */
          <>
            {/* Header */}
            <div className="border-border/60 flex items-center justify-between border-b p-5 select-none md:p-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-primary h-5 w-5" />
                <h3 className="text-base font-extrabold md:text-lg">Mi Pedido</h3>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-muted text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors"
                aria-label="Cerrar carrito"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items scroll list */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-3 py-16 text-center select-none">
                  <ShoppingCart size={40} className="text-muted-foreground/60 stroke-[1.5]" />
                  <h4 className="text-sm font-bold">Tu carrito está vacío</h4>
                  <p className="text-muted-foreground max-w-xs text-xs leading-normal">
                    Explora los platos disponibles del local y personalízalos para agregarlos a tu
                    pedido.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.priceExtra, 0)
                  const unitPrice = item.displayPrice + modifiersTotal
                  const itemTotal = unitPrice * item.quantity

                  return (
                    <div
                      key={`${item.menuItemId}-${idx}`}
                      className="border-border/45 bg-muted/20 flex gap-4 rounded-2xl border p-4 shadow-sm"
                    >
                      {/* Product Thumbnail */}
                      <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl select-none">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={20} className="text-muted-foreground/60" />
                        )}
                      </div>

                      {/* Content details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs leading-tight font-bold md:text-sm">
                              {item.name}
                            </h4>
                            {item.modifiers.length > 0 && (
                              <p className="text-muted-foreground mt-0.5 text-[10px] select-none">
                                {item.modifiers.map((m) => m.name).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-muted-foreground/80 bg-muted/40 mt-1 rounded px-2 py-0.5 text-[10px] italic">
                                &quot;{item.notes}&quot;
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(idx)}
                            className="hover:bg-destructive/10 text-muted-foreground/80 hover:text-destructive cursor-pointer rounded-lg p-1.5 transition-colors"
                            aria-label="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Adjust count footer */}
                        <div className="flex items-center justify-between gap-4">
                          {/* Selector +/- */}
                          <div className="border-border bg-card flex items-center rounded-lg border p-0.5 shadow-sm select-none">
                            <button
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="hover:bg-muted cursor-pointer rounded p-1 transition-colors"
                              aria-label="Reducir cantidad"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="hover:bg-muted cursor-pointer rounded p-1 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <span className="text-xs font-extrabold md:text-sm">
                            ${itemTotal.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Calculations and submit action footer */}
            {items.length > 0 && (
              <div className="bg-muted/30 border-border flex shrink-0 flex-col gap-4 border-t p-5 select-none md:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-semibold">Subtotal</span>
                  <span className="text-foreground text-lg font-extrabold">
                    ${cartSubtotal.toLocaleString('es-CL')}
                  </span>
                </div>

                <button
                  onClick={handleConfirmOrder}
                  className="bg-foreground text-background hover:bg-foreground/90 w-full cursor-pointer rounded-xl py-3.5 text-center text-xs font-bold tracking-wide uppercase shadow-md transition-all md:text-sm"
                >
                  Confirmar pedido
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
