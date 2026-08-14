'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Lock, AlertCircle, Loader2, Store, ArrowLeft } from 'lucide-react'
import { SatemLogo } from '@/components/ui/SatemLogo'

interface LocationOption {
  id: string
  name: string
  slug: string
}

interface LoginClientProps {
  callbackUrl: string
}

export default function LoginClient({ callbackUrl }: LoginClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'select-location'>('credentials')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [availableLocations, setAvailableLocations] = useState<LocationOption[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    name: string
    username: string
  } | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const payload: Record<string, unknown> = { username, password }
      if (step === 'select-location' && selectedLocationId) {
        payload.locationId = selectedLocationId
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Error al iniciar sesión.')
      }

      if (json.data?.requiresLocationSelection) {
        // Multi-location user -> prompt location selection
        setAvailableLocations(json.data.locations || [])
        if (json.data.locations && json.data.locations.length > 0) {
          setSelectedLocationId(json.data.locations[0].id)
        }
        if (json.data.user) {
          setAuthenticatedUser(json.data.user)
        }
        setStep('select-location')
        return
      }

      // Successful login -> redirect
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetStep = () => {
    setStep('credentials')
    setErrorMsg(null)
    setSelectedLocationId('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl duration-200">
        {/* Title / Identity */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            {step === 'select-location' ? (
              <Store className="h-5 w-5" />
            ) : (
              <KeyRound className="h-5 w-5" />
            )}
          </div>
          <h1 className="mt-3 text-lg font-black tracking-tight text-slate-900">
            <span className="inline-flex items-center justify-center gap-1.5">
              <SatemLogo className="h-5 w-auto text-slate-900" />
              <span>Food Engine</span>
            </span>
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400 uppercase">
            {step === 'select-location' ? 'Selección de Sucursal' : 'Acceso al sistema'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="animate-in fade-in slide-in-from-top-2 mb-5 flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 duration-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'credentials' ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Usuario</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Contraseña</label>
                <div className="relative mt-1">
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* User greeting */}
              {authenticatedUser && (
                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <p className="text-[11px] font-medium text-slate-500">
                    Hola, <span className="font-bold text-slate-800">{authenticatedUser.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">@{authenticatedUser.username}</p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Sucursal de Operación
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 focus:outline-none disabled:opacity-50"
                  >
                    {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Confirm Branch Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <Store className="h-3.5 w-3.5" />
                    <span>Ingresar a esta sucursal</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetStep}
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cambiar de usuario</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
