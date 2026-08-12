'use client'

import React, { useState, useCallback } from 'react'
import {
  Building2,
  Plus,
  Edit2,
  Power,
  PowerOff,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react'
import { SubNavBar } from '@/components/layout/SubNavBar'
import type { LocationDTO, LocationType } from '@/types'

interface LocationsDashboardClientProps {
  userRole: string
  initialLocations: LocationDTO[]
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  RESTAURANT: 'Restaurante',
  CAFETERIA: 'Cafetería',
  FOOD_TRUCK: 'Food Truck',
  DARK_KITCHEN: 'Dark Kitchen',
}

export function LocationsDashboardClient({
  userRole,
  initialLocations,
}: LocationsDashboardClientProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<LocationDTO[]>(initialLocations)
  const [isLoading, setIsLoading] = useState(false)

  // Form Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationDTO | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<LocationType>('RESTAURANT')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toggle Confirm Modal State
  const [toggleConfirmLoc, setToggleConfirmLoc] = useState<LocationDTO | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  // ─── Fetch Locations ────────────────────────────────────────────────────────
  const fetchLocations = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/locations')
      const json = await res.json()
      if (res.ok && json.data) {
        setLocations(json.data)
      }
    } catch (err) {
      console.error('[fetchLocations] Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Open Form Modal (Create or Edit) ───────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingLocation(null)
    setName('')
    setType('RESTAURANT')
    setAddress('')
    setCity('')
    setPhone('')
    setIsActive(true)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (loc: LocationDTO) => {
    setEditingLocation(loc)
    setName(loc.name)
    setType(loc.type)
    setAddress(loc.address || '')
    setCity(loc.city || '')
    setPhone(loc.phone || '')
    setIsActive(loc.isActive)
    setIsFormModalOpen(true)
  }

  // ─── Submit Form ────────────────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        address: address.trim() || null,
        city: city.trim() || null,
        phone: phone.trim() || null,
        isActive,
      }

      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations'
      const method = editingLocation ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al guardar la sucursal.')
      }

      setIsFormModalOpen(false)
      fetchLocations()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Ocurrió un error al procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Toggle Active ──────────────────────────────────────────────────────────
  const handleConfirmToggleActive = async () => {
    if (!toggleConfirmLoc) return

    setIsToggling(true)
    try {
      const newStatus = !toggleConfirmLoc.isActive
      const res = await fetch(`/api/locations/${toggleConfirmLoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al cambiar estado de la sucursal.')
      }

      setToggleConfirmLoc(null)
      fetchLocations()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      alert(error.message || 'Ocurrió un error al cambiar el estado.')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <main className="bg-background min-h-screen pb-20 select-none">
      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6">
        {/* Sub Navigation Bar */}
        <SubNavBar activeTab="locations" currentUserRole={userRole} />

        {/* Header Banner & Action */}
        <div className="bg-card border-border/50 flex flex-col gap-4 rounded-3xl border p-6 shadow-xs md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-xl font-black tracking-tight">
              <Building2 className="text-primary h-6 w-6" />
              Administración de Sucursales
            </h1>
            <p className="text-muted-foreground text-xs leading-normal">
              Crea, edita y gestiona el estado operacional de las sucursales de tu organización.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide uppercase shadow-md transition-all"
          >
            <Plus size={16} />
            <span>Nueva sucursal</span>
          </button>
        </div>

        {/* Locations List Table */}
        <div className="bg-card border-border/50 overflow-hidden rounded-3xl border shadow-xs">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-xs">
              <Loader2 className="text-primary animate-spin" size={20} />
              <span>Cargando sucursales...</span>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-muted-foreground space-y-2 p-16 text-center text-xs">
              <Building2 className="mx-auto h-8 w-8 opacity-40" />
              <p className="font-semibold">No hay sucursales registradas aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 border-border/40 text-muted-foreground border-b text-[11px] font-extrabold tracking-wider uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Sucursal</th>
                    <th className="px-5 py-3.5">Tipo</th>
                    <th className="px-5 py-3.5">Ubicación / Teléfono</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-border/30 divide-y">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Slug */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="text-foreground block text-sm font-extrabold">
                            {loc.name}
                          </span>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            /{loc.slug}
                          </span>
                        </div>
                      </td>

                      {/* Location Type */}
                      <td className="px-5 py-4">
                        <span className="bg-muted text-foreground border-border/50 inline-block rounded-lg border px-2.5 py-1 text-[11px] font-semibold">
                          {LOCATION_TYPE_LABELS[loc.type] || loc.type}
                        </span>
                      </td>

                      {/* Location Details */}
                      <td className="text-muted-foreground space-y-1 px-5 py-4">
                        {loc.address || loc.city ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <MapPin size={13} className="text-primary shrink-0" />
                            <span>
                              {loc.address ? loc.address : ''}
                              {loc.address && loc.city ? ', ' : ''}
                              {loc.city ? loc.city : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">
                            - Sin dirección -
                          </span>
                        )}

                        {loc.phone && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Phone size={12} className="shrink-0" />
                            <span>{loc.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {loc.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold tracking-wide text-emerald-600 uppercase">
                            <CheckCircle2 size={13} />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-extrabold tracking-wide text-amber-600 uppercase">
                            <XCircle size={13} />
                            Inactiva
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(loc)}
                            className="bg-card hover:bg-muted text-foreground border-border/60 flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs transition-all"
                          >
                            <Edit2 size={13} className="text-primary" />
                            <span>Editar</span>
                          </button>

                          {/* Toggle Active button */}
                          <button
                            type="button"
                            onClick={() => setToggleConfirmLoc(loc)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold shadow-xs transition-all ${
                              loc.isActive
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            }`}
                          >
                            {loc.isActive ? (
                              <>
                                <PowerOff size={13} />
                                <span>Desactivar</span>
                              </>
                            ) : (
                              <>
                                <Power size={13} />
                                <span>Activar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create / Edit Modal ─────────────────────────────────────────────── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFormModalOpen(false)}
          />

          <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 w-full max-w-md space-y-4 overflow-hidden rounded-3xl border p-6 shadow-2xl select-none">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
                <Building2 size={18} className="text-primary" />
                {editingLocation ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Nombre de la Sucursal *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Sucursal Centro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Tipo de Local *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LocationType)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:ring-0 focus:outline-none"
                >
                  <option value="RESTAURANT">Restaurante</option>
                  <option value="CAFETERIA">Cafetería</option>
                  <option value="FOOD_TRUCK">Food Truck</option>
                  <option value="DARK_KITCHEN">Dark Kitchen</option>
                </select>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Dirección (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Av. Providencia 1234"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Ciudad (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Santiago"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-bold">Teléfono (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. +56912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs focus:ring-0 focus:outline-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1 pt-1">
                <label className="text-foreground text-xs font-bold">Estado Operacional</label>
                <select
                  value={isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                  className="bg-muted border-border/50 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:ring-0 focus:outline-none"
                >
                  <option value="ACTIVE">Activa</option>
                  <option value="INACTIVE">Inactiva</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="border-border/60 text-foreground hover:bg-muted w-full cursor-pointer rounded-xl border py-2.5 text-xs font-bold uppercase transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-foreground text-background hover:bg-foreground/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase shadow-md transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <span>{editingLocation ? 'GUARDAR CAMBIOS' : 'CREAR SUCURSAL'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Toggle Confirmation Modal ───────────────────────────────────────── */}
      {toggleConfirmLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="animate-fade-in fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setToggleConfirmLoc(null)}
          />

          <div className="bg-card text-foreground border-border/60 animate-scale-in relative z-10 w-full max-w-md space-y-4 overflow-hidden rounded-3xl border p-6 shadow-2xl select-none">
            <div className="border-border/40 flex items-center gap-3 border-b pb-3">
              <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-500">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  {toggleConfirmLoc.isActive
                    ? '¿Desactivar esta sucursal?'
                    : '¿Activar esta sucursal?'}
                </h3>
                <p className="text-primary text-xs font-bold">{toggleConfirmLoc.name}</p>
              </div>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {toggleConfirmLoc.isActive
                ? 'Esta acción no eliminará su información histórica (ventas, pedidos, cajas e inventario), pero impedirá nuevas operaciones en esta sucursal según las reglas actuales del sistema.'
                : 'La sucursal volverá a estar disponible para operaciones activas en el sistema.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setToggleConfirmLoc(null)}
                className="border-border/60 text-foreground hover:bg-muted w-full cursor-pointer rounded-xl border py-2.5 text-xs font-bold uppercase transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={isToggling}
                onClick={handleConfirmToggleActive}
                className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white uppercase shadow-md transition-all disabled:opacity-60 ${
                  toggleConfirmLoc.isActive
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isToggling ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <span>{toggleConfirmLoc.isActive ? 'DESACTIVAR' : 'ACTIVAR'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
