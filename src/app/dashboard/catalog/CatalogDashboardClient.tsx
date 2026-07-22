/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Copy,
  Trash2,
  RotateCcw,
  History,
  Save,
  X,
  Upload,
  Loader2,
  AlertCircle,
  Layers,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProductWithFull, ProductVersion, CatalogAuditLog } from '@/types'

interface CatalogDashboardClientProps {
  organizationId: string
  locationId: string
  categories: { id: string; name: string }[]
  ingredients: { id: string; name: string; unit: string }[]
  errorMsg: string | null
}

export default function CatalogDashboardClient({
  organizationId,
  locationId,
  categories,
  ingredients,
  errorMsg,
}: CatalogDashboardClientProps) {
  // Lists & Filters
  const [products, setProducts] = useState<ProductWithFull[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'deleted'>('all')
  const [imageFilter, setImageFilter] = useState<'all' | 'with' | 'without'>('all')
  const [variantsFilter, setVariantsFilter] = useState<'all' | 'with' | 'without'>('all')
  const [modifiersFilter, setModifiersFilter] = useState<'all' | 'with' | 'without'>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // UI Views & Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formActiveTab, setFormActiveTab] = useState<
    'basic' | 'pricing' | 'variants' | 'modifiers' | 'ingredients'
  >('basic')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyActiveTab, setHistoryActiveTab] = useState<'versions' | 'audit'>('versions')

  // Selected Data for form/modals
  const [selectedProduct, setSelectedProduct] = useState<ProductWithFull | null>(null)
  const [versions, setVersions] = useState<ProductVersion[]>([])
  const [auditLogs, setAuditLogs] = useState<CatalogAuditLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Form Fields State
  const [formName, setFormName] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formShortDescription, setFormShortDescription] = useState('')
  const [formLongDescription, setFormLongDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formDefaultCategoryId, setFormDefaultCategoryId] = useState('')
  const [formBasePrice, setFormBasePrice] = useState<number | ''>('')
  const [formCost, setFormCost] = useState<number | ''>('')
  const [formTaxCategory, setFormTaxCategory] = useState<'STANDARD' | 'EXEMPT' | 'REDUCED'>(
    'STANDARD'
  )
  const [formIsAlcoholic, setFormIsAlcoholic] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)
  const [formVisibleByDefault, setFormVisibleByDefault] = useState(true)
  const [formHighlightedByDefault, setFormHighlightedByDefault] = useState(false)
  const [formEstimatedPrepTime, setFormEstimatedPrepTime] = useState<number | ''>('')
  const [formNotes, setFormNotes] = useState('')
  const [formSortOrder, setFormSortOrder] = useState<number>(0)
  const [formChangeReason, setFormChangeReason] = useState('')

  // Form Sub-collections
  const [formVariants, setFormVariants] = useState<any[]>([])
  const [formModifierGroups, setFormModifierGroups] = useState<any[]>([])
  const [formIngredients, setFormIngredients] = useState<any[]>([])

  // Global UX States
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(errorMsg)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setGlobalError(null)
    try {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        hasImage: imageFilter,
        hasVariants: variantsFilter,
        hasModifiers: modifiersFilter,
        sortBy,
        sortOrder,
      })
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const res = await fetch(`/api/catalog/products?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al obtener productos')

      setProducts(json.data.products)
      setTotal(json.data.pagination.total)
      setTotalPages(json.data.pagination.totalPages)
    } catch (err: any) {
      console.error(err)
      setGlobalError(err.message || 'Error de red al cargar catálogo')
    } finally {
      setIsLoading(false)
    }
  }, [
    organizationId,
    page,
    limit,
    statusFilter,
    imageFilter,
    variantsFilter,
    modifiersFilter,
    sortBy,
    sortOrder,
    search,
  ])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Trigger search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProducts()
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingImage(true)
    setFormError(null)
    try {
      const formData = new FormData()
      formData.append('file', files[0])

      const res = await fetch('/api/catalog/products/upload-image', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al subir imagen')

      setFormImageUrl(json.data.imageUrl)
    } catch (err: any) {
      setFormError(err.message || 'Error al subir imagen')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Open Form for Create
  const handleOpenCreate = () => {
    setFormMode('create')
    setFormActiveTab('basic')
    setFormError(null)
    setFormName('')
    setFormSku('')
    setFormSlug('')
    setFormDescription('')
    setFormShortDescription('')
    setFormLongDescription('')
    setFormImageUrl('')
    setFormDefaultCategoryId(categories[0]?.id || '')
    setFormBasePrice('')
    setFormCost('')
    setFormTaxCategory('STANDARD')
    setFormIsAlcoholic(false)
    setFormIsActive(true)
    setFormVisibleByDefault(true)
    setFormHighlightedByDefault(false)
    setFormEstimatedPrepTime('')
    setFormNotes('')
    setFormSortOrder(0)
    setFormChangeReason('')

    // Default variant standard
    setFormVariants([])
    setFormModifierGroups([])
    setFormIngredients([])

    setIsFormOpen(true)
  }

  // Open Form for Edit
  const handleOpenEdit = (p: ProductWithFull) => {
    setSelectedProduct(p)
    setFormMode('edit')
    setFormActiveTab('basic')
    setFormError(null)
    setFormName(p.name)
    setFormSku(p.sku || '')
    setFormSlug(p.slug || '')
    setFormDescription(p.description || '')
    setFormShortDescription(p.shortDescription || '')
    setFormLongDescription(p.longDescription || '')
    setFormImageUrl(p.imageUrl || '')
    setFormDefaultCategoryId(p.defaultCategoryId || '')
    setFormBasePrice(p.basePrice !== null ? p.basePrice : '')
    setFormCost(p.cost !== null ? p.cost : '')
    setFormTaxCategory(p.taxCategory)
    setFormIsAlcoholic(p.isAlcoholic)
    setFormIsActive(p.isActive)
    setFormVisibleByDefault(p.visibleByDefault)
    setFormHighlightedByDefault(p.highlightedByDefault)
    setFormEstimatedPrepTime(p.estimatedPrepTime !== null ? p.estimatedPrepTime : '')
    setFormNotes(p.notes || '')
    setFormSortOrder(p.sortOrder)
    setFormChangeReason('')

    // Map relations
    setFormVariants(p.variants.filter((v) => !v.isDefault))
    setFormModifierGroups(
      p.modifierGroups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || '',
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        isRequired: g.isRequired,
        isActive: g.isActive,
        modifiers: g.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          priceExtra: m.priceExtra,
          isActive: m.isActive,
        })),
      }))
    )
    setFormIngredients(
      (p.ingredients || []).map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity,
        cost: i.cost,
      }))
    )

    setIsFormOpen(true)
  }

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSaving(true)

    try {
      if (!formName.trim()) throw new Error('El nombre del producto es obligatorio')
      if (formBasePrice !== '' && formBasePrice <= 0)
        throw new Error('El precio base debe ser mayor a cero')

      const body: any = {
        name: formName.trim(),
        sku: formSku.trim() || null,
        slug: formSlug.trim() || null,
        description: formDescription.trim() || null,
        shortDescription: formShortDescription.trim() || null,
        longDescription: formLongDescription.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        defaultCategoryId: formDefaultCategoryId || null,
        basePrice: formBasePrice === '' ? null : Number(formBasePrice),
        cost: formCost === '' ? null : Number(formCost),
        taxCategory: formTaxCategory,
        isAlcoholic: formIsAlcoholic,
        isActive: formIsActive,
        visibleByDefault: formVisibleByDefault,
        highlightedByDefault: formHighlightedByDefault,
        estimatedPrepTime: formEstimatedPrepTime === '' ? null : Number(formEstimatedPrepTime),
        notes: formNotes.trim() || null,
        sortOrder: Number(formSortOrder),
      }

      // Add lists
      body.variants = formVariants.map((v, index) => ({
        id: v.id || undefined,
        name: v.name.trim(),
        sku: v.sku?.trim() || null,
        sortOrder: index + 1,
        isActive: v.isActive,
      }))

      body.modifierGroups = formModifierGroups.map((g, index) => ({
        id: g.id || undefined,
        name: g.name.trim(),
        description: g.description?.trim() || null,
        minSelect: Number(g.minSelect),
        maxSelect: Number(g.maxSelect),
        isRequired: g.isRequired,
        sortOrder: index + 1,
        isActive: g.isActive,
        modifiers: g.modifiers.map((m: any, mIdx: number) => ({
          id: m.id || undefined,
          name: m.name.trim(),
          priceExtra: Number(m.priceExtra || 0),
          sortOrder: mIdx + 1,
          isActive: m.isActive,
        })),
      }))

      body.ingredients = formIngredients.map((i) => ({
        ingredientId: i.ingredientId,
        quantity: Number(i.quantity),
        cost: Number(i.cost || 0),
      }))

      let res
      if (formMode === 'create') {
        res = await fetch(`/api/catalog/products?organizationId=${organizationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const params = new URLSearchParams()
        if (formChangeReason.trim()) params.append('changeReason', formChangeReason.trim())

        res = await fetch(`/api/catalog/products/${selectedProduct?.id}?${params.toString()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar el producto')

      setSuccessMessage(
        formMode === 'create'
          ? 'Producto creado correctamente'
          : 'Producto actualizado correctamente'
      )
      setIsFormOpen(false)
      fetchProducts()

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Error de red al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete Action
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas enviar este producto a la papelera?')) return
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/catalog/products/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar')

      setSuccessMessage('Producto enviado a la papelera')
      fetchProducts()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message || 'Error al eliminar producto')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Restore Action
  const handleRestoreProduct = async (id: string) => {
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/catalog/products/${id}/restore`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al restaurar')

      setSuccessMessage('Producto restaurado correctamente')
      fetchProducts()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message || 'Error al restaurar producto')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Duplicate Action
  const handleDuplicateProduct = async (id: string) => {
    setIsActionLoading(true)
    try {
      const res = await fetch(`/api/catalog/products/${id}/duplicate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al duplicar')

      setSuccessMessage('Producto clonado correctamente')
      fetchProducts()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message || 'Error al duplicar producto')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Version History & Audit logs drawer
  const handleOpenHistory = async (p: ProductWithFull) => {
    setSelectedProduct(p)
    setIsHistoryOpen(true)
    setHistoryActiveTab('versions')
    setHistoryLoading(true)
    try {
      const [versionsRes, logsRes] = await Promise.all([
        fetch(`/api/catalog/products/${p.id}/versions`),
        fetch(`/api/catalog/products/${p.id}/audit-logs`),
      ])

      const versionsJson = await versionsRes.json()
      const logsJson = await logsRes.json()

      if (versionsRes.ok) setVersions(versionsJson.data)
      if (logsRes.ok) setAuditLogs(logsJson.data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Restore previous snapshot version
  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('¿Estás seguro de que deseas revertir el producto a esta versión histórica?'))
      return
    setIsActionLoading(true)
    setIsHistoryOpen(false)
    try {
      const res = await fetch(
        `/api/catalog/products/${selectedProduct?.id}/versions/${versionId}/restore`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al restaurar versión')

      setSuccessMessage('El producto ha sido revertido a la versión seleccionada')
      fetchProducts()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setGlobalError(err.message || 'Error al restaurar versión')
    } finally {
      setIsActionLoading(false)
    }
  }

  const [isSaving, setIsSaving] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3">
        <a
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/menu"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Cambios Rápidos Menú
        </a>
        <a
          href="/dashboard/catalog"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
        >
          Catálogo Maestro
        </a>
        <a
          href="/dashboard/kitchen"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Cocina
        </a>
        <a
          href="/dashboard/pos"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          POS
        </a>
        <a
          href="/dashboard/cash"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Caja
        </a>
        <a
          href="/dashboard/users"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Usuarios
        </a>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catálogo Maestro de Productos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define la estructura base, variantes, recetas y modificadores globales de tus productos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            disabled={isActionLoading}
            className="rounded-xl px-4 py-2.5 font-medium shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="animate-in fade-in slide-in-from-top mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 duration-300">
          <CheckIcon className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Banner */}
      {globalError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Filters Bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, SKU, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:border-slate-350 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e: any) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:outline-none"
            >
              <option value="all">Estado: Activos e Inactivos</option>
              <option value="active">Estado: Solo Activos</option>
              <option value="inactive">Estado: Solo Inactivos</option>
              <option value="deleted">Estado: Papelera (Borrados)</option>
            </select>
          </div>

          <div>
            <select
              value={imageFilter}
              onChange={(e: any) => {
                setImageFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:outline-none"
            >
              <option value="all">Imágenes: Todo</option>
              <option value="with">Con Imagen</option>
              <option value="without">Sin Imagen</option>
            </select>
          </div>

          <div>
            <select
              value={variantsFilter}
              onChange={(e: any) => {
                setVariantsFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:outline-none"
            >
              <option value="all">Variantes: Todo</option>
              <option value="with">Con Variantes Extras</option>
              <option value="without">Sin Variantes Extras</option>
            </select>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200/80 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              <tr>
                <th className="p-4">Imagen</th>
                <th className="p-4">Nombre / SKU / Slug</th>
                <th className="p-4">Categoría Base</th>
                <th className="p-4 text-right">Precio Base</th>
                <th className="p-4">Características</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Loader2 className="text-slate-350 mx-auto h-7 w-7 animate-spin" />
                    <p className="mt-2 text-xs">Cargando catálogo maestro...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-slate-400 italic">
                    No se encontraron productos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="group transition-colors hover:bg-slate-50/40">
                    <td className="p-4">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-lg border border-slate-100 object-cover shadow-sm transition-transform group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                          <Plus className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs">
                        {p.sku && (
                          <span className="rounded border border-slate-200/60 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                            {p.sku}
                          </span>
                        )}
                        {p.slug && (
                          <span className="font-mono text-[11px] text-slate-400">/{p.slug}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {p.defaultCategoryName ? (
                        <span className="rounded-lg border border-slate-200/40 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {p.defaultCategoryName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-700">
                      {p.basePrice !== null ? (
                        `$${p.basePrice.toLocaleString('es-CL')}`
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.length > 1 && (
                          <span className="flex items-center gap-1 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            <Layers className="h-3 w-3" /> {p.variants.length} vars
                          </span>
                        )}
                        {p.modifierGroups.length > 0 && (
                          <span className="flex items-center gap-1 rounded border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            <Settings className="h-3 w-3" /> {p.modifierGroups.length} modifs
                          </span>
                        )}
                        {p.ingredients.length > 0 && (
                          <span className="flex items-center gap-1 rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Package className="h-3 w-3" /> {p.ingredients.length} receta
                          </span>
                        )}
                        {p.isAlcoholic && (
                          <span className="rounded border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            Alcohol
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {p.deletedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                          <Trash2 className="h-3 w-3" /> Papelera
                        </span>
                      ) : p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.deletedAt ? (
                          <button
                            onClick={() => handleRestoreProduct(p.id)}
                            disabled={isActionLoading}
                            title="Restaurar de la papelera"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Editar producto"
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateProduct(p.id)}
                              title="Duplicar producto"
                              className="hover:text-emerald-750 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenHistory(p)}
                              title="Historial de versiones"
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-700"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Eliminar producto"
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">
              Mostrando {products.length} de {total} productos
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="mx-2 text-xs font-medium text-slate-600">
                Pág {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE/EDIT FORM FULL SCREEN DRAWER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300">
          <div className="animate-in slide-in-from-right relative flex h-full w-full flex-col border-l border-slate-200 bg-white p-6 shadow-2xl duration-350 md:max-w-4xl">
            {/* Form Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {formMode === 'create'
                    ? 'Nuevo Producto de Catálogo'
                    : 'Editar Producto Estructural'}
                </h2>
                {formMode === 'edit' && (
                  <p className="text-slate-450 mt-1 font-mono text-xs">ID: {selectedProduct?.id}</p>
                )}
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error in Form */}
            {formError && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-100 bg-rose-50 p-3 text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-xs font-medium">{formError}</p>
              </div>
            )}

            {/* Tabbed Navigation */}
            <div className="mb-6 flex border-b border-slate-200">
              {[
                { id: 'basic', label: '1. Información Básica' },
                { id: 'pricing', label: '2. Operación y Precios' },
                { id: 'variants', label: '3. Variantes' },
                { id: 'modifiers', label: '4. Modificadores' },
                { id: 'ingredients', label: '5. Insumos/Receta' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormActiveTab(tab.id as any)}
                  className={`border-b-2 px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors ${
                    formActiveTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Contents */}
            <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 pb-6 text-sm text-slate-600">
                {/* TAB 1: BASIC INFORMATION */}
                {formActiveTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Nombre del Producto *
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ej: Latte Vainilla"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Categoría del Menú Asociada
                        </label>
                        <select
                          value={formDefaultCategoryId}
                          onChange={(e) => setFormDefaultCategoryId(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none"
                        >
                          <option value="">Sin Categoría (Sólo definición de catálogo)</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          SKU Técnico (Identificador único)
                        </label>
                        <input
                          type="text"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          placeholder="Ej: SKU-LAT-01"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Slug (URL amigable)
                        </label>
                        <input
                          type="text"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="Ej: latte-vainilla"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase">
                        Descripción Corta
                      </label>
                      <input
                        type="text"
                        value={formShortDescription}
                        onChange={(e) => setFormShortDescription(e.target.value)}
                        placeholder="Ej: Café expreso con leche vaporizada y jarabe de vainilla."
                        className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase">
                        Descripción Operativa (Comanda / Notas)
                      </label>
                      <textarea
                        rows={2}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Notas para cocina, especificaciones del producto..."
                        className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase">
                        Imagen del Producto (Local)
                      </label>
                      <div className="mt-1.5 flex items-center gap-4">
                        {formImageUrl ? (
                          <div className="group relative">
                            <img
                              src={formImageUrl}
                              alt="Preview"
                              className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setFormImageUrl('')}
                              className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 p-1 text-white hover:bg-rose-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                            <Upload className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            id="file-upload"
                            className="hidden"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                          >
                            {isUploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Subir archivo
                          </label>
                          <p className="mt-1.5 text-xs text-slate-400">
                            Subir una imagen local. Formato recomendado .webp / .png
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRICING & CONFIG */}
                {formActiveTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Precio de Venta Base ($) *
                        </label>
                        <input
                          type="number"
                          value={formBasePrice}
                          onChange={(e) =>
                            setFormBasePrice(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="Ej: 3200"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Costo Unitario ($) (Ingredientes)
                        </label>
                        <input
                          type="number"
                          value={formCost}
                          onChange={(e) =>
                            setFormCost(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder="Ej: 900"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Categoría Tributaria
                        </label>
                        <select
                          value={formTaxCategory}
                          onChange={(e) => setFormTaxCategory(e.target.value as any)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none"
                        >
                          <option value="STANDARD">Estándar (IVA 19%)</option>
                          <option value="EXEMPT">Exento de Impuestos</option>
                          <option value="REDUCED">Reducido (IVA 10%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase">
                          Tiempo de Preparación Est. (minutos)
                        </label>
                        <input
                          type="number"
                          value={formEstimatedPrepTime}
                          onChange={(e) =>
                            setFormEstimatedPrepTime(
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder="Ej: 8"
                          className="focus:border-slate-350 mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Atributos Operativos
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={formIsActive}
                            onChange={(e) => setFormIsActive(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-700">
                              Habilitado en Catálogo
                            </span>
                            <span className="text-slate-450 text-[10px]">
                              Define si el producto está disponible.
                            </span>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={formVisibleByDefault}
                            onChange={(e) => setFormVisibleByDefault(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-700">
                              Visible por Defecto
                            </span>
                            <span className="text-slate-450 text-[10px]">
                              Visible automáticamente al crear menús.
                            </span>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={formHighlightedByDefault}
                            onChange={(e) => setFormHighlightedByDefault(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-700">
                              Destacado por Defecto
                            </span>
                            <span className="text-slate-450 text-[10px]">
                              Destaca el producto en la carta digital.
                            </span>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={formIsAlcoholic}
                            onChange={(e) => setFormIsAlcoholic(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-slate-900 focus:ring-0"
                          />
                          <div>
                            <span className="block text-xs font-bold text-slate-700">
                              Contiene Alcohol
                            </span>
                            <span className="text-slate-450 text-[10px]">
                              Aplica restricciones y avisos en carta.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: VARIANTS */}
                {formActiveTab === 'variants' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-1 text-xs font-bold text-slate-700">
                        Variaciones Extras de Producto
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-400">
                        La variación estándar &ldquo;Estándar&rdquo; se crea automáticamente con el
                        precio base. Agrega variaciones aquí si tu producto tiene tamaños (Grande,
                        Mediano) u otros atributos estructurales exclusivos.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {formVariants.map((v, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                        >
                          <div className="grid flex-1 grid-cols-2 gap-3">
                            <input
                              type="text"
                              required
                              value={v.name}
                              placeholder="Nombre de la variante (Ej: Grande)"
                              onChange={(e) => {
                                const copy = [...formVariants]
                                copy[index].name = e.target.value
                                setFormVariants(copy)
                              }}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={v.sku || ''}
                              placeholder="SKU Variante (Opcional)"
                              onChange={(e) => {
                                const copy = [...formVariants]
                                copy[index].sku = e.target.value
                                setFormVariants(copy)
                              }}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>

                          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              checked={v.isActive}
                              onChange={(e) => {
                                const copy = [...formVariants]
                                copy[index].isActive = e.target.checked
                                setFormVariants(copy)
                              }}
                              className="rounded border-slate-300 text-slate-900"
                            />
                            Activo
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setFormVariants(formVariants.filter((_, i) => i !== index))
                            }}
                            className="rounded-lg border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-200/50 hover:bg-white hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setFormVariants([...formVariants, { name: '', sku: '', isActive: true }])
                        }}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" />
                        Añadir Variante Extra
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: MODIFIERS */}
                {formActiveTab === 'modifiers' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-1 text-xs font-bold text-slate-700">
                        Grupos de Opciones / Modificadores
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-400">
                        Configura las opciones que el cliente puede elegir al comprar este producto
                        (Ej: &ldquo;Elige tu salsa&rdquo;, &ldquo;Ingredientes Extras&rdquo;).
                      </p>
                    </div>

                    <div className="space-y-4">
                      {formModifierGroups.map((g, gIdx) => (
                        <div
                          key={gIdx}
                          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                              <input
                                type="text"
                                required
                                value={g.name}
                                placeholder="Nombre del Grupo (Ej: Agrega Extras 🍟)"
                                onChange={(e) => {
                                  const copy = [...formModifierGroups]
                                  copy[gIdx].name = e.target.value
                                  setFormModifierGroups(copy)
                                }}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Mín"
                                  value={g.minSelect}
                                  onChange={(e) => {
                                    const copy = [...formModifierGroups]
                                    copy[gIdx].minSelect = e.target.value
                                    setFormModifierGroups(copy)
                                  }}
                                  className="w-16 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                                />
                                <input
                                  type="number"
                                  placeholder="Máx"
                                  value={g.maxSelect}
                                  onChange={(e) => {
                                    const copy = [...formModifierGroups]
                                    copy[gIdx].maxSelect = e.target.value
                                    setFormModifierGroups(copy)
                                  }}
                                  className="w-16 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                                />
                                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                                  <input
                                    type="checkbox"
                                    checked={g.isRequired}
                                    onChange={(e) => {
                                      const copy = [...formModifierGroups]
                                      copy[gIdx].isRequired = e.target.checked
                                      setFormModifierGroups(copy)
                                    }}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                                  />
                                  Obligatorio
                                </label>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFormModifierGroups(
                                  formModifierGroups.filter((_, i) => i !== gIdx)
                                )
                              }}
                              className="rounded-lg border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Options list inside group */}
                          <div className="space-y-2.5 border-l-2 border-slate-200 pl-4">
                            <div className="text-slate-450 text-[11px] font-bold tracking-wider uppercase">
                              Opciones del Grupo
                            </div>
                            {g.modifiers.map((m: any, mIdx: number) => (
                              <div key={mIdx} className="flex items-center gap-3">
                                <input
                                  type="text"
                                  required
                                  value={m.name}
                                  placeholder="Nombre opción (Ej: Tocino)"
                                  onChange={(e) => {
                                    const copy = [...formModifierGroups]
                                    copy[gIdx].modifiers[mIdx].name = e.target.value
                                    setFormModifierGroups(copy)
                                  }}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                                />
                                <input
                                  type="number"
                                  placeholder="Precio extra (Ej: 990)"
                                  value={m.priceExtra === 0 ? '' : m.priceExtra}
                                  onChange={(e) => {
                                    const copy = [...formModifierGroups]
                                    copy[gIdx].modifiers[mIdx].priceExtra =
                                      e.target.value === '' ? 0 : Number(e.target.value)
                                    setFormModifierGroups(copy)
                                  }}
                                  className="w-28 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...formModifierGroups]
                                    copy[gIdx].modifiers = copy[gIdx].modifiers.filter(
                                      (_: any, i: number) => i !== mIdx
                                    )
                                    setFormModifierGroups(copy)
                                  }}
                                  className="rounded border border-transparent p-1 text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-rose-700"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...formModifierGroups]
                                copy[gIdx].modifiers.push({
                                  name: '',
                                  priceExtra: 0,
                                  isActive: true,
                                })
                                setFormModifierGroups(copy)
                              }}
                              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                            >
                              <Plus className="h-3 w-3" /> Añadir Opción
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setFormModifierGroups([
                            ...formModifierGroups,
                            {
                              name: '',
                              minSelect: 0,
                              maxSelect: 1,
                              isRequired: false,
                              isActive: true,
                              modifiers: [],
                            },
                          ])
                        }}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" />
                        Nuevo Grupo de Opciones
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: INGREDIENTS */}
                {formActiveTab === 'ingredients' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h4 className="mb-1 text-xs font-bold text-slate-700">
                        Receta y Ficha Técnica (Insumos)
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-400">
                        Vincula materias primas del inventario a este producto. Al venderse el
                        producto, estos insumos se descontarán automáticamente del stock del local
                        correspondiente.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {formIngredients.map((i, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                        >
                          <div className="grid flex-1 grid-cols-3 gap-3">
                            <select
                              value={i.ingredientId}
                              onChange={(e) => {
                                const copy = [...formIngredients]
                                copy[index].ingredientId = e.target.value
                                setFormIngredients(copy)
                              }}
                              className="text-slate-750 col-span-2 rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none"
                            >
                              <option value="">Selecciona un insumo...</option>
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.unit})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="any"
                              required
                              value={i.quantity === 0 ? '' : i.quantity}
                              placeholder="Cant."
                              onChange={(e) => {
                                const copy = [...formIngredients]
                                copy[index].quantity =
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                setFormIngredients(copy)
                              }}
                              className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setFormIngredients(formIngredients.filter((_, idx) => idx !== index))
                            }}
                            className="rounded-lg border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {ingredients.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No hay materias primas configuradas en la base de datos.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setFormIngredients([
                              ...formIngredients,
                              { ingredientId: '', quantity: 0, cost: 0 },
                            ])
                          }}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Plus className="h-4 w-4" />
                          Vincular Insumo
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="mt-auto space-y-4 border-t border-slate-200 bg-white pt-5">
                {formMode === 'edit' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                      Motivo del Cambio (Versión Snapshot) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formChangeReason}
                      onChange={(e) => setFormChangeReason(e.target.value)}
                      placeholder="Ej: Actualización de precios y receta de insumos..."
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> Guardar Producto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY & AUDIT LOG PANEL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300">
          <div className="animate-in slide-in-from-right relative flex h-full w-full flex-col border-l border-slate-200 bg-white p-6 shadow-2xl duration-350 md:max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                  <History className="text-slate-650 h-5 w-5" />
                  Historial & Auditoría: {selectedProduct?.name}
                </h2>
                <p className="text-slate-450 mt-1 text-xs">
                  Auditoría completa del Catálogo Maestro
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setHistoryActiveTab('versions')}
                className={`border-b-2 px-6 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${
                  historyActiveTab === 'versions'
                    ? 'border-slate-900 text-slate-900'
                    : 'text-slate-450 border-transparent hover:text-slate-700'
                }`}
              >
                Snapshots de Versiones ({versions.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryActiveTab('audit')}
                className={`border-b-2 px-6 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${
                  historyActiveTab === 'audit'
                    ? 'border-slate-900 text-slate-900'
                    : 'text-slate-450 border-transparent hover:text-slate-700'
                }`}
              >
                Logs de Auditoría ({auditLogs.length})
              </button>
            </div>

            {/* List Panels */}
            <div className="flex-1 overflow-y-auto pr-2 pb-6 text-sm text-slate-600">
              {historyLoading ? (
                <div className="text-slate-450 flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : historyActiveTab === 'versions' ? (
                versions.length === 0 ? (
                  <p className="p-12 text-center text-slate-400 italic">
                    No hay versiones registradas aún.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {versions.map((v) => (
                      <div
                        key={v.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              Versión #{v.versionNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(v.createdAt).toLocaleString('es-CL')}
                            </span>
                          </div>
                          <p className="mt-1 font-bold text-slate-800">{v.productSnapshot.name}</p>
                          <p className="text-xs font-medium text-slate-500 italic">
                            &ldquo;{v.changeReason || 'Sin descripción del cambio'}&rdquo;
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] font-medium text-slate-400">
                            <span>
                              Base: ${Number(v.pricesSnapshot.basePrice).toLocaleString('es-CL')}
                            </span>
                            <span>•</span>
                            <span>Variantes: {v.variantsSnapshot.length}</span>
                            <span>•</span>
                            <span>Receta: {v.ingredientsSnapshot.length} insumos</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRestoreVersion(v.id)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : auditLogs.length === 0 ? (
                <p className="p-12 text-center text-slate-400 italic">
                  No hay registros de auditoría.
                </p>
              ) : (
                <div className="border-slate-150 relative ml-2 space-y-6 border-l-2 pl-4">
                  {auditLogs.map((l) => (
                    <div key={l.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute top-1.5 -left-[21px] h-3 w-3 rounded-full border-2 border-white bg-slate-200" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                              l.event === 'CREATED'
                                ? 'border border-emerald-100 bg-emerald-50 text-emerald-800'
                                : l.event === 'UPDATED'
                                  ? 'border border-blue-100 bg-blue-50 text-blue-800'
                                  : 'border border-rose-100 bg-rose-50 text-rose-800'
                            }`}
                          >
                            {l.event}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(l.createdAt).toLocaleString('es-CL')}
                          </span>
                        </div>
                        {l.details?.changeReason && (
                          <p className="mt-0.5 text-xs text-slate-500 italic">
                            Motivo: &ldquo;{l.details.changeReason}&rdquo;
                          </p>
                        )}
                        {l.details?.duplicatedFrom && (
                          <p className="text-xs text-slate-500">
                            Clonado desde producto ID: {l.details.duplicatedFrom}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
