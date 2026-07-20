'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react'

function MockPaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const provider = searchParams.get('provider') || 'sumup'
  const paymentId = searchParams.get('paymentId') || ''
  const amountStr = searchParams.get('amount') || '0'
  const currency = searchParams.get('currency') || 'CLP'
  const tx = searchParams.get('tx') || 'mock_tx_demo'

  const amount = Number(amountStr)

  const [isLoading, setIsLoading] = useState(false)
  const [actionDone, setActionDone] = useState<'approved' | 'rejected' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const providerName =
    provider.toLowerCase() === 'webpay' ? 'Webpay Plus (Transbank)' : 'SumUp Cloud API'

  const handleSimulate = async (action: 'approve' | 'reject') => {
    if (!paymentId) {
      setErrorMsg('No se encontró el ID de pago en la solicitud.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/payments/mock-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error al procesar la simulación de pago.')
      }

      setActionDone(action === 'approve' ? 'approved' : 'rejected')

      const orderId = result.data?.orderId
      setTimeout(() => {
        if (orderId) {
          router.push(`/menu/track?id=${orderId}`)
        } else {
          router.back()
        }
      }, 1200)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorMsg(error.message || 'Error inesperado al simular el pago.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-border/60 bg-card/95 w-full max-w-lg overflow-hidden rounded-3xl border p-6 shadow-2xl backdrop-blur-xl md:p-8">
        {/* Environment Badge Header */}
        <div className="border-border/40 flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              <Sparkles size={13} /> Pasarela Mock
            </span>
          </div>
          <span className="text-muted-foreground text-xs font-medium">Modo Desarrollo</span>
        </div>

        {/* Payment Title & Provider Details */}
        <div className="my-6 space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner">
            <CreditCard className="h-8 w-8 stroke-[1.75]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Simulación de Pago</h1>
          <p className="text-muted-foreground text-sm">
            Estás probando la pasarela{' '}
            <span className="text-foreground font-semibold">{providerName}</span>
          </p>
        </div>

        {/* Order & Payment Summary Box */}
        <div className="bg-muted/50 border-border/50 space-y-3 rounded-2xl border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Monto a pagar</span>
            <span className="text-foreground text-xl font-black">
              ${amount.toLocaleString('es-CL')} {currency}
            </span>
          </div>
          <div className="border-border/30 text-muted-foreground space-y-1 border-t pt-2 font-mono text-xs">
            <div className="flex justify-between">
              <span>ID Pago:</span>
              <span className="text-foreground max-w-[200px] truncate font-semibold">
                {paymentId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transacción TRX:</span>
              <span className="text-foreground max-w-[200px] truncate font-semibold">{tx}</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert Messages */}
        {errorMsg && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-xl border p-3.5 text-center text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {actionDone === 'approved' && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} /> ¡Pago aprobado! Redirigiendo a tu pedido...
          </div>
        )}

        {actionDone === 'rejected' && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive mt-4 flex items-center justify-center gap-2 rounded-xl border p-3.5 text-xs font-semibold">
            <XCircle size={16} /> Pago rechazado. Redirigiendo a tu pedido...
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => handleSimulate('approve')}
            disabled={isLoading || actionDone !== null}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Aprobar Pago (Simular Éxito)
              </>
            )}
          </button>

          <button
            onClick={() => handleSimulate('reject')}
            disabled={isLoading || actionDone !== null}
            className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Rechazar Pago (Simular Error)
          </button>

          <button
            onClick={() => router.back()}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
          >
            <ArrowLeft size={14} /> Volver al pedido
          </button>
        </div>

        {/* Security & Disclaimer Footer */}
        <div className="text-muted-foreground/60 mt-6 flex items-center justify-center gap-1.5 text-[11px]">
          <ShieldCheck size={13} /> SATEM Mock Gateway • Simulación local sin cobros reales
        </div>
      </div>
    </main>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <MockPaymentContent />
    </Suspense>
  )
}
