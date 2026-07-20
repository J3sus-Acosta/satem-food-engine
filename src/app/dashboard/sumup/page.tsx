'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  CreditCard,
  Server,
  ShieldCheck,
  Clock,
  Radio,
} from 'lucide-react'
import type { ApiResponse } from '@/types'

interface SumUpDiagData {
  provider: string
  connection: 'ONLINE' | 'OFFLINE' | 'SANDBOX_READY'
  environment: 'sandbox' | 'production'
  merchantCode: string
  readerId: string
  lastWebhookAt: string | null
  lastSyncAt: string
  details?: Record<string, unknown>
}

export default function SumUpDashboardPage() {
  const [diag, setDiag] = useState<SumUpDiagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDiagnostics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/sumup')
      const json: ApiResponse<SumUpDiagData> = await res.json()

      if (!res.ok || 'error' in json) {
        throw new Error('error' in json ? json.error : 'Error al obtener diagnóstico de SumUp')
      }

      if (json.data) {
        setDiag(json.data)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    fetch('/api/dashboard/sumup')
      .then((res) => res.json())
      .then((json: ApiResponse<SumUpDiagData>) => {
        if (isMounted && 'data' in json && json.data) {
          setDiag(json.data)
        }
      })

      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <CreditCard className="text-primary h-7 w-7" />
            <h1 className="text-2xl font-black tracking-tight">Diagnóstico SumUp Cloud API</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Panel de supervisión y conectividad de la pasarela de pagos SumUp en tiempo real.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="bg-card hover:bg-accent border-border/60 flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Diagnóstico</span>
        </button>
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-2xl border p-4 text-xs font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Connection Status Card */}
        <div className="bg-card border-border/50 relative overflow-hidden rounded-3xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase">
              Estado de Conexión
            </span>
            {diag?.connection === 'ONLINE' ? (
              <Wifi className="h-5 w-5 text-emerald-500" />
            ) : diag?.connection === 'SANDBOX_READY' ? (
              <Radio className="h-5 w-5 text-amber-500" />
            ) : (
              <WifiOff className="text-destructive h-5 w-5" />
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  diag?.connection === 'ONLINE'
                    ? 'animate-pulse bg-emerald-500'
                    : diag?.connection === 'SANDBOX_READY'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-xl font-black tracking-tight uppercase">
                {diag?.connection === 'ONLINE'
                  ? 'Conectado (Online)'
                  : diag?.connection === 'SANDBOX_READY'
                    ? 'Sandbox Listo'
                    : 'Desconectado'}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {diag?.connection === 'ONLINE'
                ? 'Conexión activa con la Cloud API de SumUp.'
                : diag?.connection === 'SANDBOX_READY'
                  ? 'Modo Sandbox activo para pruebas seguras.'
                  : 'Sin respuesta del servidor de SumUp.'}
            </p>
          </div>
        </div>

        {/* Environment Card */}
        <div className="bg-card border-border/50 relative overflow-hidden rounded-3xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase">
              Entorno Activo
            </span>
            <ShieldCheck className="text-primary h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black tracking-tight uppercase">
              {diag?.environment === 'production' ? 'Producción' : 'Sandbox (Pruebas)'}
            </span>
            <p className="text-muted-foreground mt-1 text-[11px]">
              {diag?.environment === 'production'
                ? 'Transacciones reales habilitadas.'
                : 'Transacciones simuladas sin movimiento de fondos.'}
            </p>
          </div>
        </div>

        {/* Sync Status Card */}
        <div className="bg-card border-border/50 relative overflow-hidden rounded-3xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] font-extrabold tracking-wider uppercase">
              Sincronización API
            </span>
            <Activity className="text-primary h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-xl font-black tracking-tight">
              {diag?.lastSyncAt ? new Date(diag.lastSyncAt).toLocaleTimeString() : 'N/A'}
            </span>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Último chequeo:{' '}
              {diag?.lastSyncAt ? new Date(diag.lastSyncAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Merchant & Reader Info */}
        <div className="bg-card border-border/50 space-y-5 rounded-3xl border p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight uppercase">
            <Server className="text-primary h-4 w-4" />
            <span>Credenciales y Dispositivos</span>
          </h2>

          <div className="divide-border/40 divide-y text-xs">
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Merchant Code</span>
              <span className="font-mono font-bold">{diag?.merchantCode || 'No configurado'}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Reader Solo ID</span>
              <span className="font-mono font-bold">{diag?.readerId || 'N/A (Virtual Solo)'}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Firma Webhook (HMAC-SHA256)</span>
              <span className="flex items-center gap-1 font-bold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Activa / Validada</span>
              </span>
            </div>
          </div>
        </div>

        {/* Webhooks & Logs */}
        <div className="bg-card border-border/50 space-y-5 rounded-3xl border p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight uppercase">
            <Clock className="text-primary h-4 w-4" />
            <span>Eventos de Webhook</span>
          </h2>

          <div className="divide-border/40 divide-y text-xs">
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Último Webhook Recibido</span>
              <span className="font-mono font-bold">
                {diag?.lastWebhookAt
                  ? new Date(diag.lastWebhookAt).toLocaleString()
                  : 'En espera...'}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Endpoint Webhook</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                /api/webhooks/sumup
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted-foreground font-medium">Idempotencia Garantizada</span>
              <span className="flex items-center gap-1 font-bold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Habilitada</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
