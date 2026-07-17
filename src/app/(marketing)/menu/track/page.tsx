'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import {
  CustomerOrderProvider,
  useCustomerOrder,
} from '@/components/customer/order/CustomerOrderProvider'
import type { ApiResponse, OrderWithItems, PaymentProvider } from '@/types'

function OrderTrackerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { order: localOrder, setOrder } = useCustomerOrder()

  const [orderIdInput, setOrderIdInput] = useState('')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => {
    const paramId = searchParams.get('id')
    if (paramId) return paramId
    return localOrder?.orderId || null
  })

  // Polled state
  const [order, setOrderData] = useState<OrderWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Payment states
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('SUMUP')
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false)

  // 1. Sync URL parameter and local storage
  useEffect(() => {
    const paramId = searchParams.get('id')
    if (activeOrderId) {
      if (paramId !== activeOrderId) {
        router.replace(`/menu/track?id=${activeOrderId}`)
      }
    }
  }, [activeOrderId, searchParams, router])

  // 2. Poll order data periodically (using lightweight status endpoint)
  useEffect(() => {
    if (!activeOrderId) return

    let isMounted = true

    // Fetch full order details
    const fetchFullOrder = async (showLoader = false) => {
      if (showLoader) setIsLoading(true)
      try {
        const res = await fetch(`/api/orders/${activeOrderId}`)
        const result: ApiResponse<OrderWithItems> = await res.json()

        if (!res.ok || 'error' in result) {
          throw new Error('error' in result ? result.error : 'No se pudo cargar el pedido')
        }

        if (result.data && isMounted) {
          setOrderData(result.data)
          // Sync local order status
          setOrder({
            orderId: result.data.id,
            orderNumber: result.data.orderNumber,
            locationId: result.data.locationId,
            status: result.data.status,
          })
          setErrorMsg('')
        }
      } catch (err: unknown) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err))
          setErrorMsg(error.message || 'Error al conectar con el servidor.')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    // Initial full load
    fetchFullOrder(true)

    // Poll lightweight status endpoint every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrderId}/status`)
        const result: ApiResponse<{ status: string; orderNumber: string }> = await res.json()

        if (res.ok && 'data' in result && result.data && isMounted) {
          const newStatus = result.data.status

          // Trigger full reload only if status transitions
          setOrderData((prev) => {
            if (!prev || prev.status !== newStatus) {
              // Trigger asynchronous reload of full order details
              fetchFullOrder(false)
            }
            return prev
          })

          // Sync local order details
          setOrder({
            orderId: activeOrderId,
            orderNumber: result.data.orderNumber,
            locationId: localOrder?.locationId || '',
            status: newStatus,
          })

          if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
            clearInterval(interval)
          }
        }
      } catch (err) {
        console.error('[OrderTracker polling error]:', err)
      }
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [activeOrderId, setOrder, localOrder?.locationId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanId = orderIdInput.trim()
    if (cleanId) {
      setActiveOrderId(cleanId)
      router.push(`/menu/track?id=${cleanId}`)
    }
  }

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setIsInitiatingPayment(true)
    setErrorMsg('')

    try {
      const response = await fetch(`/api/orders/${order.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          amount: Number(order.totalAmount),
          currency: 'CLP',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'No se pudo iniciar la pasarela de pagos.')
      }

      if (result.data && result.data.checkoutUrl) {
        // Redirect client to SumUp/Webpay checkout URL
        window.location.href = result.data.checkoutUrl
      } else {
        throw new Error('No se recibió la URL de redirección de pago.')
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[OrderTracker.handlePaySubmit] Payment init error:', error)
      setErrorMsg(error.message || 'Error al iniciar el pago.')
    } finally {
      setIsInitiatingPayment(false)
    }
  }

  // Stepper Visual resolution
  const getStepperStep = (status: string): number => {
    switch (status) {
      case 'DRAFT':
        return 1
      case 'PENDING':
        return 2
      case 'CONFIRMED':
        return 3
      case 'PREPARING':
        return 4
      case 'READY':
        return 5
      case 'DELIVERED':
        return 6
      default:
        return 1
    }
  }

  const currentStep = order ? getStepperStep(order.status) : 1

  return (
    <main className="bg-background flex min-h-screen flex-col pb-20">
      {/* Header Bar */}
      <header className="border-border/40 bg-card/60 sticky top-0 z-20 border-b py-4 backdrop-blur-md select-none">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
          <button
            onClick={() => router.push('/menu')}
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Volver a la Carta</span>
          </button>
          <span className="text-xs font-extrabold tracking-wide uppercase">Estado del Pedido</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-6">
        {/* Search screen fallback */}
        {!activeOrderId && (
          <div className="bg-card border-border/50 flex flex-col items-center justify-center space-y-6 rounded-3xl border p-8 py-16 text-center shadow-sm">
            <div className="bg-primary/5 text-primary flex h-14 w-14 items-center justify-center rounded-full">
              <Search className="h-6 w-6 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold tracking-tight">Buscar mi Pedido</h3>
              <p className="text-muted-foreground max-w-xs text-xs leading-normal">
                Ingresa el código identificador de tu pedido para consultar su preparación en tiempo
                real.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm gap-2">
              <input
                type="text"
                required
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Código del pedido (ej. clkd...)"
                className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 flex-1 rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer rounded-xl px-5 text-xs font-semibold transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        )}

        {isLoading && !order && (
          <div className="flex flex-col items-center justify-center space-y-3 py-20 select-none">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <span className="text-muted-foreground text-xs">
              Cargando detalles de preparación...
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="text-destructive bg-destructive/5 flex items-center gap-2 rounded-xl p-4 text-xs select-none">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {order && (
          <>
            {/* Stepper Progress Card */}
            <div className="bg-card border-border/50 space-y-6 rounded-3xl border p-5 shadow-sm md:p-6">
              <div className="border-border/40 flex items-start justify-between border-b pb-4.5">
                <div>
                  <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                    Número de Retiro
                  </span>
                  <h2 className="text-2xl font-black tracking-tight">#{order.orderNumber}</h2>
                </div>

                <div className="text-right select-none">
                  <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                    Estado
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${
                      order.status === 'CANCELLED'
                        ? 'bg-red-500/10 text-red-500'
                        : order.status === 'DELIVERED'
                          ? 'bg-green-500/10 text-green-500'
                          : order.status === 'READY'
                            ? 'animate-pulse bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {order.status === 'DRAFT'
                      ? 'Borrador'
                      : order.status === 'PENDING'
                        ? 'Pendiente de Pago'
                        : order.status === 'CONFIRMED'
                          ? 'Confirmado'
                          : order.status === 'PREPARING'
                            ? 'En Preparación'
                            : order.status === 'READY'
                              ? 'Listo para Retirar'
                              : order.status === 'DELIVERED'
                                ? 'Entregado'
                                : 'Cancelado'}
                  </span>
                </div>
              </div>

              {/* Progress Stepper Visual */}
              {order.status !== 'CANCELLED' ? (
                <div className="relative pt-2 pb-4 select-none">
                  {/* Progress Line bar */}
                  <div className="bg-muted absolute top-6 right-6 left-6 -z-10 h-0.5" />
                  <div
                    className="bg-primary absolute top-6 left-6 -z-10 h-0.5 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                  />

                  <div className="flex items-center justify-between text-center">
                    {/* Step 1: CREATED */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 1
                            ? 'bg-primary text-primary-foreground shadow-primary/25 scale-105 font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 1 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '1'}
                      </div>
                      <span className="text-[9px] font-bold tracking-wider uppercase">Creado</span>
                    </div>

                    {/* Step 2: PENDING_PAYMENT */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 2
                            ? 'bg-primary text-primary-foreground shadow-primary/25 scale-105 font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 2 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '2'}
                      </div>
                      <span className="max-w-[50px] text-[9px] leading-tight font-bold tracking-wider text-wrap uppercase">
                        Por Pagar
                      </span>
                    </div>

                    {/* Step 3: PAID */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 3
                            ? 'bg-primary text-primary-foreground shadow-primary/25 scale-105 font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 3 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '3'}
                      </div>
                      <span className="text-[9px] font-bold tracking-wider uppercase">Pagado</span>
                    </div>

                    {/* Step 4: PREPARING */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 4
                            ? 'bg-primary text-primary-foreground shadow-primary/25 scale-105 font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 4 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '4'}
                      </div>
                      <span className="max-w-[55px] text-[9px] leading-tight font-bold tracking-wider text-wrap uppercase">
                        En Cocina
                      </span>
                    </div>

                    {/* Step 5: READY */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 5
                            ? 'bg-primary text-primary-foreground shadow-primary/25 scale-105 font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 5 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '5'}
                      </div>
                      <span className="text-[9px] font-bold tracking-wider uppercase">Listo</span>
                    </div>

                    {/* Step 6: COMPLETED */}
                    <div className="flex flex-col items-center space-y-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          currentStep >= 6
                            ? 'bg-primary text-primary-foreground font-black shadow-md'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > 6 ? <CheckCircle size={14} className="stroke-[2.5]" /> : '6'}
                      </div>
                      <span className="text-[9px] font-bold tracking-wider uppercase">
                        Entregado
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl bg-red-500/5 p-4 text-red-500 select-none">
                  <AlertCircle className="mt-0.5 shrink-0" size={16} />
                  <div className="space-y-1">
                    <span className="text-xs font-bold">Pedido Cancelado</span>
                    <p className="text-muted-foreground text-[11px] leading-normal">
                      Motivo: {order.cancellationReason || 'Cancelación de usuario o de cocina'}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimated Prep Time Banner */}
              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                <div className="bg-muted/40 border-border/40 flex items-center gap-3 rounded-2xl border p-4.5 select-none">
                  <Clock className="text-primary shrink-0" size={18} />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold">Tiempo estimado de preparación</span>
                    <p className="text-muted-foreground text-[11px] leading-none">
                      Aproximadamente 12 - 15 minutos una vez confirmado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Portal Stage (Draft checkout action box) */}
            {order.status === 'DRAFT' && (
              <div className="bg-card border-border/50 space-y-4 rounded-3xl border p-5 shadow-sm md:p-6">
                <div className="flex items-start gap-3 select-none">
                  <CreditCard className="text-primary mt-0.5 shrink-0" size={18} />
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold md:text-base">Confirmar y Pagar</h3>
                    <p className="text-muted-foreground text-xs leading-normal">
                      Tu pedido se encuentra registrado temporalmente. Elige tu medio de pago
                      preferido para enviarlo directamente a cocina.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePaySubmit} className="space-y-4">
                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-3 select-none">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('SUMUP')}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                        selectedProvider === 'SUMUP'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border/60 hover:bg-muted/30'
                      }`}
                      disabled={isInitiatingPayment}
                    >
                      <span className="text-sm font-extrabold tracking-wide uppercase">
                        SumUp Checkout
                      </span>
                      <span className="text-muted-foreground text-[10px]">Débito y Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProvider('WEBPAY')}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                        selectedProvider === 'WEBPAY'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border/60 hover:bg-muted/30'
                      }`}
                      disabled={isInitiatingPayment}
                    >
                      <span className="text-sm font-extrabold tracking-wide uppercase">
                        Transbank Webpay
                      </span>
                      <span className="text-muted-foreground text-[10px]">Redcompra nacional</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isInitiatingPayment}
                    className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-4 text-center text-xs font-bold tracking-wide uppercase shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  >
                    {isInitiatingPayment ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>Abriendo pasarela de pagos...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Pagar Pedido (${Number(order.totalAmount).toLocaleString('es-CL')})
                        </span>
                        <ExternalLink size={14} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Order Items Details list */}
            <div className="bg-card border-border/50 space-y-4 rounded-3xl border p-5 shadow-sm md:p-6">
              <h3 className="text-sm font-bold select-none md:text-base">Detalles del Pedido</h3>

              <div className="divide-border/40 divide-y">
                {order.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex justify-between gap-4 py-3 text-xs md:text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-semibold">
                          {item.quantity}x
                        </span>
                        <span className="font-bold">{item.name}</span>
                      </div>
                      {item.modifiers.length > 0 && (
                        <p className="text-muted-foreground pl-6 text-[10px] select-none">
                          {item.modifiers.map((m) => m.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-muted-foreground/80 pl-6 text-[10px] italic">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 font-semibold">
                      ${Number(item.subtotal).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="border-border/50 space-y-1.5 border-t pt-4 text-xs md:text-sm">
                <div className="text-muted-foreground flex justify-between select-none">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toLocaleString('es-CL')}</span>
                </div>
                <div className="text-muted-foreground flex justify-between select-none">
                  <span>Impuestos (IVA 19%)</span>
                  <span>${Number(order.taxAmount).toLocaleString('es-CL')}</span>
                </div>
                <div className="text-foreground border-border/30 flex justify-between border-t border-dashed pt-1 text-sm font-extrabold">
                  <span>Total</span>
                  <span>${Number(order.totalAmount).toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default function OrderTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center space-y-3">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <span className="text-muted-foreground text-xs">Cargando seguimiento...</span>
        </div>
      }
    >
      <CustomerOrderProvider>
        <OrderTrackerContent />
      </CustomerOrderProvider>
    </Suspense>
  )
}
