'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CustomerOrderState {
  orderId: string
  orderNumber: string
  locationId: string
  status: string
}

interface CustomerOrderContextType {
  order: CustomerOrderState | null
  setOrder: (order: CustomerOrderState) => void
  clearOrder: () => void
}

const CustomerOrderContext = createContext<CustomerOrderContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'satem_customer_order'

export function CustomerOrderProvider({ children }: { children: React.ReactNode }) {
  const [order, setOrderState] = useState<CustomerOrderState | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        return stored ? JSON.parse(stored) : null
      } catch (e) {
        console.error('[CustomerOrderProvider] Error reading localStorage on init:', e)
        return null
      }
    }
    return null
  })
  const [isHydrated, setIsHydrated] = useState(false)

  // Safe client hydration mount check
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true)
  }, [])

  // Persist order updates
  useEffect(() => {
    if (!isHydrated) return
    try {
      if (order) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(order))
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    } catch (e) {
      console.error('[CustomerOrderProvider] Error updating localStorage:', e)
    }
  }, [order, isHydrated])

  const setOrder = (newOrder: CustomerOrderState) => {
    setOrderState(newOrder)
  }

  const clearOrder = () => {
    setOrderState(null)
  }

  return (
    <CustomerOrderContext.Provider
      value={{ order: isHydrated ? order : null, setOrder, clearOrder }}
    >
      {children}
    </CustomerOrderContext.Provider>
  )
}

export function useCustomerOrder() {
  const context = useContext(CustomerOrderContext)
  if (context === undefined) {
    throw new Error('useCustomerOrder must be used within a CustomerOrderProvider')
  }
  return context
}
