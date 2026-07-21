'use client'

import React, { useState } from 'react'
import { X, Check, AlertCircle, Plus, Minus } from 'lucide-react'
import { useCustomerCart } from './CustomerCartProvider'
import type { MenuItemWithProduct } from '@/types'

interface ProductCustomizerProps {
  item: MenuItemWithProduct | null
  isOpen: boolean
  onClose: () => void
}

export function ProductCustomizer({ item, isOpen, onClose }: ProductCustomizerProps) {
  const { addItem } = useCustomerCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (!isOpen || !item) return null

  const product = item.productVariant.product
  const modifierGroups = item.modifierGroups || []
  const currentVariant = item.productVariant
  const basePrice =
    item.dailyMenuOverride?.price !== null && item.dailyMenuOverride?.price !== undefined
      ? Number(item.dailyMenuOverride.price)
      : Number(item.price)

  const handleModifierSelect = (groupId: string, modifierId: string, maxSelect: number) => {
    setSelectedModifiers((prev) => {
      const selected = prev[groupId] || []

      // If already selected, deselect it
      if (selected.includes(modifierId)) {
        const updated = {
          ...prev,
          [groupId]: selected.filter((id) => id !== modifierId),
        }
        // Clean error if condition met
        validateGroup(groupId, updated[groupId])
        return updated
      }

      // Single select (radio button behavior)
      if (maxSelect === 1) {
        const updated = {
          ...prev,
          [groupId]: [modifierId],
        }
        validateGroup(groupId, updated[groupId])
        return updated
      }

      // Multi select limit check
      if (selected.length >= maxSelect) {
        return prev
      }

      const updated = {
        ...prev,
        [groupId]: [...selected, modifierId],
      }
      validateGroup(groupId, updated[groupId])
      return updated
    })
  }

  const validateGroup = (groupId: string, selectedList: string[]) => {
    const group = modifierGroups.find((g) => g.id === groupId)
    if (!group) return true

    const isRequired = group.isRequired
    const min = group.minSelect || (isRequired ? 1 : 0)
    const max = group.maxSelect

    if (isRequired && selectedList.length < min) {
      setValidationErrors((prev) => ({
        ...prev,
        [groupId]: `Por favor selecciona al menos ${min} opción(es).`,
      }))
      return false
    }

    if (max !== null && selectedList.length > max) {
      setValidationErrors((prev) => ({
        ...prev,
        [groupId]: `Puedes seleccionar un máximo de ${max} opción(es).`,
      }))
      return false
    }

    // Clean error
    setValidationErrors((prev) => {
      const copy = { ...prev }
      delete copy[groupId]
      return copy
    })
    return true
  }

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    modifierGroups.forEach((group) => {
      const selectedList = selectedModifiers[group.id] || []
      const isRequired = group.isRequired
      const min = group.minSelect || (isRequired ? 1 : 0)
      const max = group.maxSelect

      if (isRequired && selectedList.length < min) {
        errors[group.id] = `Por favor selecciona al menos ${min} opción(es) para "${group.name}".`
        isValid = false
      }

      if (max !== null && selectedList.length > max) {
        errors[group.id] = `Puedes seleccionar un máximo de ${max} opción(es) para "${group.name}".`
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const handleAddToCart = () => {
    if (!validateAll()) {
      // Scroll customizer dialog to top to show errors if needed
      return
    }

    // Resolve modifier snapshots
    const chosenModifiers: Array<{ modifierId: string; name: string; priceExtra: number }> = []
    Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
      const group = modifierGroups.find((g) => g.id === groupId)
      if (!group) return

      modifierIds.forEach((modId) => {
        const mod = group.modifiers.find((m) => m.id === modId)
        if (mod) {
          chosenModifiers.push({
            modifierId: mod.id,
            name: mod.name,
            priceExtra: Number(mod.priceExtra),
          })
        }
      })
    })

    // Add to cart
    addItem({
      productId: product.id,
      menuItemId: item.id,
      variantId: currentVariant.id,
      name: item.name || product.name,
      displayPrice: basePrice,
      imageUrl: item.imageUrl || product.imageUrl,
      quantity,
      notes: notes.trim() ? notes : null,
      modifiers: chosenModifiers,
    })

    onClose()
  }

  // Calculate live total price in real time
  const calculateLivePrice = (): number => {
    let modsPrice = 0
    Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
      const group = modifierGroups.find((g) => g.id === groupId)
      if (!group) return
      modifierIds.forEach((modId) => {
        const mod = group.modifiers.find((m) => m.id === modId)
        if (mod) {
          modsPrice += Number(mod.priceExtra)
        }
      })
    })
    return (basePrice + modsPrice) * quantity
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="bg-card text-foreground border-border/80 animate-scale-in relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl">
        {/* Cover image or colored header */}
        <div className="bg-muted relative h-40 shrink-0 md:h-48">
          {item.imageUrl || product.imageUrl ? (
            <img
              src={item.imageUrl || product.imageUrl || ''}
              alt={item.name || product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-primary/5 text-primary/80 flex h-full w-full items-center justify-center">
              <span className="text-sm font-semibold tracking-wide uppercase">SATEM Food</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 cursor-pointer rounded-full border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/75"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body scrollable */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              {item.name || product.name}
            </h2>
            {product.isAlcoholic && (
              <span className="mt-1.5 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-500 uppercase">
                Contiene Alcohol 🔞
              </span>
            )}
            {item.description && (
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed md:text-sm">
                {item.description}
              </p>
            )}
          </div>

          {/* Variant specifications (Read-only reference) */}
          {currentVariant && (
            <div className="bg-muted/40 border-border/40 rounded-xl border p-3">
              <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                Presentación / Variante
              </span>
              <p className="mt-0.5 text-xs font-semibold md:text-sm">{currentVariant.name}</p>
            </div>
          )}

          {/* Modifier selection groups */}
          {modifierGroups.length > 0 && (
            <div className="space-y-6">
              {modifierGroups.map((group) => {
                const selectedList = selectedModifiers[group.id] || []
                const isRequired = group.isRequired
                const error = validationErrors[group.id]

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-bold md:text-base">
                          {group.name}
                          {isRequired && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-red-500 uppercase">
                              Obligatorio
                            </span>
                          )}
                        </h4>
                        {group.description && (
                          <p className="text-muted-foreground text-xs leading-tight">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground bg-muted shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                        {group.maxSelect === 1 ? 'Elige 1' : `Elige hasta ${group.maxSelect}`}
                      </span>
                    </div>

                    {error && (
                      <div className="text-destructive bg-destructive/5 flex items-center gap-1.5 rounded-lg p-2.5 text-xs">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="grid gap-2">
                      {group.modifiers.map((mod) => {
                        const isChecked = selectedList.includes(mod.id)
                        const showPrice = Number(mod.priceExtra) > 0

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => handleModifierSelect(group.id, mod.id, group.maxSelect)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                              isChecked
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border/60 hover:border-border hover:bg-muted/30 text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-4.5 w-4.5 items-center justify-center rounded border transition-all ${
                                  isChecked
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/30 bg-card'
                                }`}
                              >
                                {isChecked && <Check size={11} strokeWidth={3.5} />}
                              </div>
                              <span className="text-xs font-semibold md:text-sm">{mod.name}</span>
                            </div>
                            {showPrice && (
                              <span className="bg-muted text-foreground/80 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                                + ${Number(mod.priceExtra).toLocaleString('es-CL')}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Notes area */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold md:text-base">Notas especiales</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Sin condimentos, aderezos al lado, etc."
              rows={2}
              maxLength={250}
              className="border-border/60 bg-card focus:border-primary placeholder:text-muted-foreground/60 w-full resize-none rounded-xl border p-3 text-xs focus:ring-0 focus:outline-none md:text-sm"
            />
          </div>
        </div>

        {/* Quantity selector and checkout action footer */}
        <div className="bg-muted/30 border-border flex shrink-0 flex-col gap-4 border-t p-5 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">Cantidad</span>

            {/* Quantity buttons */}
            <div className="border-border bg-card flex items-center rounded-xl border p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="hover:bg-muted text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="text-foreground w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="hover:bg-muted text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
                Total
              </span>
              <span className="text-foreground text-lg font-extrabold md:text-xl">
                ${calculateLivePrice().toLocaleString('es-CL')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-foreground text-background hover:bg-foreground/90 flex-1 cursor-pointer rounded-xl py-3.5 text-center text-xs font-bold tracking-wide uppercase shadow-md transition-all md:text-sm"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
