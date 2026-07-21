'use client'

import React, { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { MenuItemWithProduct } from '@/types'

interface ProductDetailModalProps {
  item: MenuItemWithProduct | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({ item, isOpen, onClose }: ProductDetailModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})

  if (!isOpen || !item) return null

  const product = item.productVariant.product
  const modifierGroups = item.modifierGroups || []
  const currentVariant = item.productVariant

  // Calculate live total price
  const calculateTotalPrice = (): number => {
    // Start with the base price of the item itself (corresponds to the MenuItem price)
    // Wait! Since MenuItem already has a price, if it's the non-default variant, does the price change?
    // In our mock data and DB model, MenuItem represents a specific productVariantId projection.
    // So if the user selects a different variant, we should look up if that variant exists as another MenuItem in the category,
    // or calculate it by adding the priceExtra difference.
    // In our implementation, since the MenuItem is variant-specific, if they switch variant in the modal,
    // we can adjust the price: (item.price - defaultVariant.priceExtra) + selectedVariant.priceExtra.
    // Wait, let's keep it simple: if the variant changes, we adjust by the difference in the base prices/variants,
    // or simply display the price of the MenuItem itself.
    // Let's check: in the mock data, we have separate MenuItems for each variant (e.g. Simple = 6990, Doble = 8490).
    // So we can find if there is another MenuItem in the same category for the selected variant.
    // If yes, we use its price. If not, we fall back to: item.price + (selectedVariant.priceExtra - currentVariant.priceExtra).
    // Let's do that! That is extremely smart and covers both cases.
    const basePrice = item.price
    // Find if another MenuItem exists in the category for the selected variant
    // In this scope, we don't have the sibling menu items in the modal, so we can calculate via price differences or variant details.
    // Let's look up if the variant has a different price extra.
    // Let's assume: basePrice = item.price. If they select a variant that is different from item.productVariantId,
    // we can calculate the difference. In MOCK_VARIANTS, Doble has priceExtra 1500, Simple has 0.
    // So the difference is 1500!
    // So we can do: basePrice + (selectedVariant.priceExtra - currentVariant.priceExtra) if variants have those fields.
    // Wait, in our new ProductVariant type:
    // `price` is on MenuItem, and ProductVariant has no priceExtra in schema.prisma (it was removed in approved schema!).
    // Let's check schema.prisma: ProductVariant has only id, productId, name, sku, isDefault, sortOrder, isActive.
    // And MenuItem has `price`!
    // Ah! So there is a MenuItem for each variant.
    // So to select a variant, the user actually selects from the different MenuItems in the category!
    // Yes! That's exactly how the schema is designed: MenuItem projects a specific ProductVariant.
    // So in the category, we have: "MCI Burger Clásica (Simple)" and "MCI Burger Clásica (Doble)" as separate items.
    // This is super clean! It means the modal doesn't need to switch between variant MenuItems unless we want to,
    // or we can show the details of that specific MenuItem (with its specific variant) and let them customize its modifiers.
    // Let's show the specific variant of this MenuItem, and allow them to choose modifiers!
    // Wait, what if there are modifier groups? We calculate the price by adding modifier priceExtras:
    let total = basePrice
    Object.values(selectedModifiers).forEach((modifierIds) => {
      modifierIds.forEach((modId) => {
        // Find modifier priceExtra
        modifierGroups.forEach((group) => {
          const mod = group.modifiers.find((m) => m.id === modId)
          if (mod) {
            total += Number(mod.priceExtra)
          }
        })
      })
    })

    return total
  }

  const handleModifierSelect = (groupId: string, modifierId: string, maxSelect: number) => {
    setSelectedModifiers((prev) => {
      const selected = prev[groupId] || []
      if (selected.includes(modifierId)) {
        return {
          ...prev,
          [groupId]: selected.filter((id) => id !== modifierId),
        }
      }

      if (maxSelect === 1) {
        return {
          ...prev,
          [groupId]: [modifierId],
        }
      }

      if (selected.length >= maxSelect) {
        // Replace first selected or do nothing. Let's do nothing or replace the last one.
        // Usually, doing nothing is standard, or replacing. Let's do nothing if maximum reached.
        return prev
      }

      return {
        ...prev,
        [groupId]: [...selected, modifierId],
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-card text-foreground border-border/80 animate-scale-in relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header Image / Color bar */}
        <div className="bg-muted relative h-48 md:h-56">
          {item.imageUrl || product.imageUrl ? (
            <img
              src={item.imageUrl || product.imageUrl || ''}
              alt={item.name || product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="bg-primary/5 text-primary flex h-full w-full items-center justify-center">
              <span className="text-lg font-medium">Sin imagen</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full border border-white/10 bg-black/50 p-2 text-white backdrop-blur-md transition-all hover:bg-black/70"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                {item.name || product.name}
              </h2>
            </div>
            {product.isAlcoholic && (
              <span className="mt-2 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                Contiene Alcohol 🔞
              </span>
            )}
            {item.description && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {/* Variant label if exists */}
          {currentVariant && (
            <div className="bg-muted/40 border-border/50 rounded-xl border p-3">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Presentación / Variante
              </span>
              <p className="mt-0.5 text-sm font-semibold">{currentVariant.name}</p>
            </div>
          )}

          {/* Modifier Groups */}
          {modifierGroups.length > 0 && (
            <div className="space-y-6 pt-2">
              {modifierGroups.map((group) => {
                const selectedList = selectedModifiers[group.id] || []
                const isRequired = group.isRequired

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="flex items-center gap-1.5 text-sm font-semibold md:text-base">
                          {group.name}
                          {isRequired && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-500">
                              Obligatorio
                            </span>
                          )}
                        </h4>
                        {group.description && (
                          <p className="text-muted-foreground text-xs">{group.description}</p>
                        )}
                      </div>
                      <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
                        {group.maxSelect === 1 ? 'Elige 1' : `Elige hasta ${group.maxSelect}`}
                      </span>
                    </div>

                    <div className="grid gap-2">
                      {group.modifiers.map((mod) => {
                        const isChecked = selectedList.includes(mod.id)
                        const showPrice = Number(mod.priceExtra) > 0

                        return (
                          <button
                            key={mod.id}
                            onClick={() => handleModifierSelect(group.id, mod.id, group.maxSelect)}
                            className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                              isChecked
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border/60 hover:border-border hover:bg-muted/35'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                                  isChecked
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/30 bg-card'
                                }`}
                              >
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </div>
                              <span className="text-sm font-medium">{mod.name}</span>
                            </div>
                            {showPrice && (
                              <span className="bg-muted text-foreground/80 rounded-full px-2 py-0.5 text-xs font-semibold">
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
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-border flex items-center justify-between gap-4 border-t p-6">
          <div>
            <span className="text-muted-foreground block text-xs font-medium">Total estimado</span>
            <span className="text-foreground text-xl font-bold md:text-2xl">
              ${calculateTotalPrice().toLocaleString('es-CL')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold transition-all md:text-base"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
