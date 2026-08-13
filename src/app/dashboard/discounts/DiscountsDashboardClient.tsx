'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SubNavBar } from '@/components/layout/SubNavBar'
import { isAdminOrOwner } from '@/lib/permissions'
import {
  Search,
  Plus,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Copy,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiscountCredit, DiscountCreditType, DiscountCreditValueType } from '@/types'

interface DiscountsDashboardClientProps {
  locationId: string
  locations: { id: string; name: string }[]
  currentUserRole: string
}

export default function DiscountsDashboardClient({
  locationId: initialLocationId,
  locations,
  currentUserRole,
}: DiscountsDashboardClientProps) {
  const isDiscountAdmin = isAdminOrOwner(currentUserRole)
  // State lists
  const [discounts, setDiscounts] = useState<DiscountCredit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  // Modals & Active objects
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCredit | null>(null)
  const [selectedDiscountToDelete, setSelectedDiscountToDelete] = useState<DiscountCredit | null>(
    null
  )

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formType, setFormType] = useState<DiscountCreditType>('DISCOUNT')
  const [formValueType, setFormValueType] = useState<DiscountCreditValueType>('PERCENTAGE')
  const [formValue, setFormValue] = useState<string>('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formLocationId, setFormLocationId] = useState('')

  // UX feedbacks
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 4000)
  }

  // Fetch Discount Credits
  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('locationId', initialLocationId)

      if (typeFilter !== 'all') queryParams.set('type', typeFilter)
      if (statusFilter === 'active') queryParams.set('isActive', 'true')
      if (statusFilter === 'inactive') queryParams.set('isActive', 'false')
      if (search.trim()) queryParams.set('search', search)

      const res = await fetch(`/api/discounts?${queryParams.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al obtener beneficios')

      let data: DiscountCredit[] = json.data || []

      // Client-side filtering for Location Scope
      if (locationFilter !== 'all') {
        if (locationFilter === 'global') {
          data = data.filter((item) => item.locationId === null)
        } else {
          data = data.filter((item) => item.locationId === locationFilter)
        }
      }

      setDiscounts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      showError(message)
    } finally {
      setIsLoading(false)
    }
  }, [initialLocationId, typeFilter, statusFilter, locationFilter, search])

  // Trigger search / filters with debounce/timeout to avoid synchronous setState inside effect
  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchDiscounts()
      },
      search ? 350 : 0
    )
    return () => clearTimeout(timer)
  }, [fetchDiscounts, search])

  // Create Discount Submit
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setIsActionLoading(true)

    try {
      if (!formName.trim()) throw new Error('El nombre es obligatorio')
      const valNum = Number(formValue)
      if (isNaN(valNum) || valNum <= 0) {
        throw new Error('El valor debe ser un número positivo')
      }
      if (formType === 'CREDIT' && formValueType !== 'FIXED_AMOUNT') {
        throw new Error('Los créditos solo admiten monto fijo')
      }
      if (formValueType === 'PERCENTAGE' && valNum > 100) {
        throw new Error('El porcentaje no puede ser mayor a 100%')
      }

      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: formLocationId || null,
          name: formName,
          description: formDescription || null,
          type: formType,
          valueType: formValueType,
          value: valNum,
          isActive: formIsActive,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear beneficio')

      showSuccess(`Beneficio "${formName}" creado con éxito`)
      setIsCreateModalOpen(false)
      fetchDiscounts()

      // Reset form
      setFormName('')
      setFormDescription('')
      setFormType('DISCOUNT')
      setFormValueType('PERCENTAGE')
      setFormValue('')
      setFormIsActive(true)
      setFormLocationId('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear beneficio'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Edit Modal
  const openEdit = (dc: DiscountCredit) => {
    setSelectedDiscount(dc)
    setFormName(dc.name)
    setFormDescription(dc.description || '')
    setFormType(dc.type)
    setFormValueType(dc.valueType)
    setFormValue(String(dc.value))
    setFormIsActive(dc.isActive)
    setFormLocationId(dc.locationId || '')
    setModalError(null)
    setIsEditModalOpen(true)
  }

  // Update Submit
  const handleUpdateDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDiscount) return
    setModalError(null)
    setIsActionLoading(true)

    try {
      if (!formName.trim()) throw new Error('El nombre es obligatorio')
      const valNum = Number(formValue)
      if (isNaN(valNum) || valNum <= 0) {
        throw new Error('El valor debe ser un número positivo')
      }
      if (formType === 'CREDIT' && formValueType !== 'FIXED_AMOUNT') {
        throw new Error('Los créditos sólo admiten la modalidad de monto fijo')
      }
      if (formValueType === 'PERCENTAGE' && valNum > 100) {
        throw new Error('El porcentaje no puede ser mayor a 100%')
      }

      const res = await fetch(`/api/discounts/${selectedDiscount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription || null,
          type: formType,
          valueType: formValueType,
          locationId: formLocationId || null,
          value: valNum,
          isActive: formIsActive,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar beneficio')

      showSuccess(`Beneficio "${formName}" actualizado con éxito`)
      setIsEditModalOpen(false)
      fetchDiscounts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar beneficio'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Duplicate Discount
  const handleDuplicateDiscount = async (dc: DiscountCredit) => {
    if (!isDiscountAdmin) return
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/discounts/${dc.id}/duplicate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al duplicar beneficio')

      showSuccess(`Beneficio "${json.data?.name || dc.name + ' - Copia'}" creado con éxito`)
      fetchDiscounts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al duplicar beneficio'
      showError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Delete Confirmation Modal
  const openDeleteModal = (dc: DiscountCredit) => {
    setSelectedDiscountToDelete(dc)
    setIsDeleteModalOpen(true)
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedDiscountToDelete) return
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/discounts/${selectedDiscountToDelete.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar beneficio')

      showSuccess(`Beneficio "${selectedDiscountToDelete.name}" eliminado con éxito`)
      setIsDeleteModalOpen(false)
      setSelectedDiscountToDelete(null)
      fetchDiscounts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar beneficio'
      showError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Toggle Active State
  const handleToggleActive = async (dc: DiscountCredit) => {
    if (!isDiscountAdmin) return
    setIsActionLoading(true)
    const endpoint = dc.isActive ? 'disable' : 'enable'
    try {
      const res = await fetch(`/api/discounts/${dc.id}/${endpoint}`, {
        method: 'PATCH',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cambiar estado')

      showSuccess(`Beneficio "${dc.name}" ${dc.isActive ? 'desactivado' : 'activado'} con éxito`)
      fetchDiscounts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado'
      showError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const formatValue = (dc: DiscountCredit) => {
    if (dc.valueType === 'PERCENTAGE') {
      return `${dc.value}%`
    }
    return `$${Number(dc.value).toLocaleString('es-CL')}`
  }

  const formatDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Navigation Sub-bar */}
      <SubNavBar activeTab="discounts" currentUserRole={currentUserRole} />

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Módulo de Descuentos y Créditos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define los beneficios comerciales que el cajero podrá aplicar rápidamente a las ventas
            en POS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDiscountAdmin && (
            <Button
              onClick={() => {
                setModalError(null)
                // Set default form values
                setFormName('')
                setFormDescription('')
                setFormType('DISCOUNT')
                setFormValueType('PERCENTAGE')
                setFormValue('')
                setFormIsActive(true)
                setFormLocationId('')
                setIsCreateModalOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nuevo Beneficio
            </Button>
          )}
          <Button
            onClick={() => fetchDiscounts()}
            disabled={isLoading}
            variant="outline"
            className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* UX Feedbacks */}
      {successMessage && (
        <div className="animate-in fade-in slide-in-from-top mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Filters & Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Filters Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Tipo: Todos</option>
              <option value="DISCOUNT">Descuentos</option>
              <option value="CREDIT">Créditos</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Estado: Todos</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Alcance: Todos</option>
              <option value="global">Global (Organización)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  Local: {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Benefits Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-slate-400">
              <p className="text-sm">No se encontraron descuentos ni créditos.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-500">
              <thead>
                <tr className="text-slate-650 border-b border-slate-200 bg-slate-50/70 font-semibold">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Modalidad</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Alcance</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Última Modificación</th>
                  {isDiscountAdmin && <th className="px-6 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map((dc) => (
                  <tr key={dc.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{dc.name}</div>
                      {dc.description && (
                        <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                          {dc.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          dc.type === 'DISCOUNT'
                            ? 'border border-blue-100 bg-blue-50 text-blue-700'
                            : 'border border-purple-100 bg-purple-50 text-purple-700'
                        }`}
                      >
                        {dc.type === 'DISCOUNT' ? 'Descuento' : 'Crédito'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dc.valueType === 'PERCENTAGE' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <Percent className="h-3 w-3 text-slate-400" /> Porcentaje
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <DollarSign className="h-3 w-3 text-slate-400" /> Monto Fijo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{formatValue(dc)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {dc.locationId ? (
                        <span>
                          Local:{' '}
                          {locations.find((l) => l.id === dc.locationId)?.name || 'Específico'}
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-400">Global (Org)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={!isDiscountAdmin || isActionLoading}
                        onClick={() => handleToggleActive(dc)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          dc.isActive
                            ? 'border border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border border-rose-100 bg-rose-50 text-rose-800 hover:bg-rose-100'
                        } disabled:opacity-85`}
                      >
                        {dc.isActive ? (
                          <>
                            <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> Activo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-3.5 w-3.5 text-rose-600" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400">
                      {formatDateTime(dc.updatedAt)}
                    </td>
                    {isDiscountAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => openEdit(dc)}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="Editar beneficio"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDuplicateDiscount(dc)}
                            disabled={isActionLoading}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="Duplicar beneficio"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => openDeleteModal(dc)}
                            disabled={isActionLoading}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-rose-200 bg-white p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            title="Eliminar beneficio"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Crear Nuevo Beneficio</h3>
            <p className="mt-1 text-xs text-slate-500">
              Registra un nuevo descuento o crédito aplicable en POS.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDiscount} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nombre del Beneficio
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Cliente Frecuente 10%"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Descuento aplicable a clientes frecuentes"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as DiscountCreditType
                      setFormType(newType)
                      if (newType === 'CREDIT') {
                        setFormValueType('FIXED_AMOUNT')
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="DISCOUNT">Descuento</option>
                    <option value="CREDIT">Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Modalidad
                  </label>
                  <select
                    value={formValueType}
                    disabled={formType === 'CREDIT'}
                    onChange={(e) => setFormValueType(e.target.value as DiscountCreditValueType)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none disabled:opacity-50"
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Valor del Beneficio
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formValueType === 'PERCENTAGE' ? '100' : undefined}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formValueType === 'PERCENTAGE' ? 'Ej: 10' : 'Ej: 5000'}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Alcance (Local)
                  </label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Global (Organización)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActiveCreate"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label
                  htmlFor="formIsActiveCreate"
                  className="text-xs font-semibold text-slate-700"
                >
                  Activar beneficio inmediatamente
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="rounded-xl px-4 text-xs font-bold text-white"
                >
                  {isActionLoading ? 'Creando...' : 'Crear Beneficio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedDiscount && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Editar Beneficio</h3>
            <p className="mt-1 text-xs text-slate-500">
              Modifica la información básica o el valor del beneficio comercial.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDiscount} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nombre del Beneficio
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as DiscountCreditType
                      setFormType(newType)
                      if (newType === 'CREDIT') {
                        setFormValueType('FIXED_AMOUNT')
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="DISCOUNT">Descuento</option>
                    <option value="CREDIT">Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Modalidad
                  </label>
                  <select
                    value={formValueType}
                    disabled={formType === 'CREDIT'}
                    onChange={(e) => setFormValueType(e.target.value as DiscountCreditValueType)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none disabled:opacity-50"
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED_AMOUNT">Monto Fijo ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Valor del Beneficio
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formValueType === 'PERCENTAGE' ? '100' : undefined}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Alcance (Local)
                  </label>
                  <select
                    value={formLocationId}
                    onChange={(e) => setFormLocationId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Global (Organización)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActiveEdit"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="formIsActiveEdit" className="text-xs font-semibold text-slate-700">
                  Beneficio activo y disponible
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="rounded-xl px-4 text-xs font-bold text-white"
                >
                  {isActionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedDiscountToDelete && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar Beneficio?</h3>
                <p className="text-xs text-slate-500">{selectedDiscountToDelete.name}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 text-xs text-amber-900">
              <p className="font-semibold">Preservación del historial comercial:</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                Si este beneficio posee ventas u órdenes pasadas asociadas, se desactivará y
                archivará automáticamente para preservar la integridad de los reportes históricos.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
                className="rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
              >
                {isActionLoading ? 'Eliminando...' : 'Eliminar Beneficio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
