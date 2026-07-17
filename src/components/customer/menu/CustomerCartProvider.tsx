'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartModifier {
  modifierId: string
  name: string
  priceExtra: number
}

export interface CartItem {
  productId: string
  menuItemId: string
  variantId: string
  name: string
  displayPrice: number
  imageUrl: string | null
  quantity: number
  notes: string | null
  modifiers: CartModifier[]
}

interface CustomerCartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  cartSubtotal: number
}

const CustomerCartContext = createContext<CustomerCartContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'satem_customer_cart'

export function CustomerCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
      } catch (e) {
        console.error('[CustomerCartProvider] Error reading localStorage on init:', e)
        return []
      }
    }
    return []
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // 1. Safe hydration: Mark as hydrated on client mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true)
  }, [])

  // 2. Persist in localStorage on changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('[CustomerCartProvider] Error writing localStorage:', e)
    }
  }, [items, isHydrated])

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prevItems) => {
      const quantityToAdd = newItem.quantity ?? 1

      // Search for an exact match (same item, variant, modifiers, and customer notes)
      const existingIndex = prevItems.findIndex((item) => {
        const isSameVariant =
          item.menuItemId === newItem.menuItemId && item.variantId === newItem.variantId
        const isSameNotes = (item.notes || '').trim() === (newItem.notes || '').trim()

        if (!isSameVariant || !isSameNotes) return false

        // Compare modifiers arrays length and IDs
        if (item.modifiers.length !== newItem.modifiers.length) return false

        const itemModIds = item.modifiers.map((m) => m.modifierId).sort()
        const newItemModIds = newItem.modifiers.map((m) => m.modifierId).sort()

        return itemModIds.every((id, idx) => id === newItemModIds[idx])
      })

      if (existingIndex !== -1) {
        // Consolidated match: increase quantity
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        }
        return updated
      }

      // New unique item: append to cart
      return [...prevItems, { ...newItem, quantity: quantityToAdd }]
    })
  }

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, idx) => idx !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index)
      return
    }
    setItems((prevItems) => {
      const updated = [...prevItems]
      if (updated[index]) {
        updated[index] = { ...updated[index], quantity }
      }
      return updated
    })
  }

  const clearCart = () => {
    setItems([])
  }

  // Derived states
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers.reduce((mSum, m) => mSum + m.priceExtra, 0)
    return sum + (item.displayPrice + modifiersTotal) * item.quantity
  }, 0)

  // Avoid rendering children before hydration to prevent mismatch server/client values
  return (
    <CustomerCartContext.Provider
      value={{
        items: isHydrated ? items : [],
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems: isHydrated ? totalItems : 0,
        cartSubtotal: isHydrated ? cartSubtotal : 0,
      }}
    >
      {children}
    </CustomerCartContext.Provider>
  )
}

export function useCustomerCart() {
  const context = useContext(CustomerCartContext)
  if (context === undefined) {
    throw new Error('useCustomerCart must be used within a CustomerCartProvider')
  }
  return context
}
