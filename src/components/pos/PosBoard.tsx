'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  DollarSign,
  CreditCard,
  Utensils,
  ShoppingBag,
  Truck,
  CheckCircle2,
  X,
  UserCheck,
  RotateCcw,
  ChefHat,
  Loader2,
  Sparkles,
  Printer,
  Calculator,
} from 'lucide-react'
import type {
  MenuWithCategories,
  MenuItemWithProduct,
  ModifierGroup,
  OrderWithItems,
} from '@/types'
import { KitchenTicketPrinter } from '../kitchen/KitchenTicketPrinter'
import { getStockCardBgClass } from '@/lib/stock-status'

interface PosBoardProps {
  menu: MenuWithCategories
}

interface CartItemModifier {
  modifierId: string
  name: string
  priceExtra: number
}

interface CartItem {
  id: string // unique cart item id
  menuItemId: string
  name: string
  price: number
  quantity: number
  modifiers: CartItemModifier[]
  notes?: string
}

export function PosBoard({ menu }: PosBoardProps) {
  // Navigation & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Order Details
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY')
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [staffNote, setStaffNote] = useState<string>('')

  // Cart & Discount states
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [customDiscountAmount, setCustomDiscountAmount] = useState<number>(0)
  const [isStaffMeal, setIsStaffMeal] = useState<boolean>(false)

  // Modals & UI States
  const [activeItemForModifiers, setActiveItemForModifiers] = useState<MenuItemWithProduct | null>(
    null
  )
  const [selectedModifiersModal, setSelectedModifiersModal] = useState<Record<string, string[]>>({})
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false)

  // Payment & Printing states
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'CARD_POS' | 'TRANSFER' | 'STAFF_MEAL'
  >('CASH')
  const [cashGiven, setCashGiven] = useState<string>('')
  const [shouldAutoPrintTicket, setShouldAutoPrintTicket] = useState<boolean>(true)
  const [activeTicketToPrint, setActiveTicketToPrint] = useState<OrderWithItems | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string
    orderNumber: string
    totalAmount: number
    amountPaid: number
    change: number
    orderData: OrderWithItems
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Filter Categories & Items
  const categories = menu.categories || []
  const allItems = useMemo(() => {
    return categories
      .flatMap((cat) => cat.items || [])
      .filter((item) => item.isVisible && item.dailyMenuOverride?.isVisible !== false)
  }, [categories])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
      const matchesSearch =
        !searchQuery ||
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [allItems, selectedCategory, searchQuery])

  // Subtotal & Total calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const modSum = item.modifiers.reduce((mSum, m) => mSum + m.priceExtra, 0)
      return sum + (item.price + modSum) * item.quantity
    }, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    if (isStaffMeal) return subtotal // 100% discount for employee staff meal
    if (customDiscountAmount > 0) return Math.min(customDiscountAmount, subtotal)
    if (discountPercent > 0) return Math.round((subtotal * discountPercent) / 100)
    return 0
  }, [subtotal, isStaffMeal, customDiscountAmount, discountPercent])

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal, discountAmount])

  // Cart operations
  const handleItemClick = (item: MenuItemWithProduct) => {
    const stockVal = item.dailyMenuOverride?.stockDaily
    const isAvailable =
      item.isAvailable &&
      item.dailyMenuOverride?.isAvailable !== false &&
      (stockVal === null || stockVal === undefined || stockVal > 0)

    if (!isAvailable) return

    if (item.modifierGroups && item.modifierGroups.length > 0) {
      // Open modifier selection modal
      setActiveItemForModifiers(item)
      // Pre-select defaults for required groups
      const initialSel: Record<string, string[]> = {}
      item.modifierGroups.forEach((group) => {
        if (group.modifiers && group.modifiers.length > 0) {
          initialSel[group.id] = [group.modifiers[0].id]
        }
      })
      setSelectedModifiersModal(initialSel)
    } else {
      // Add directly to cart
      addDirectToCart(item, [])
    }
  }

  const addDirectToCart = (item: MenuItemWithProduct, modifiers: CartItemModifier[]) => {
    setCart((prev) => {
      const cartItemId = `${item.id}_${modifiers.map((m) => m.modifierId).join('-')}`
      const existing = prev.find((i) => i.id === cartItemId)
      if (existing) {
        return prev.map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [
        ...prev,
        {
          id: cartItemId,
          menuItemId: item.id,
          name: item.name || item.productVariant?.product?.name || 'Producto Sin Nombre',
          price: Number(item.price),
          quantity: 1,
          modifiers,
        },
      ]
    })
  }

  const handleConfirmModifiersModal = () => {
    if (!activeItemForModifiers) return

    // Build selected modifiers array
    const resolvedModifiers: CartItemModifier[] = []
    ;(activeItemForModifiers.modifierGroups || []).forEach((group) => {
      const selectedIds = selectedModifiersModal[group.id] || []
      selectedIds.forEach((modId) => {
        const foundMod = group.modifiers.find((m) => m.id === modId)
        if (foundMod) {
          resolvedModifiers.push({
            modifierId: foundMod.id,
            name: foundMod.name,
            priceExtra: Number(foundMod.priceExtra),
          })
        }
      })
    })

    addDirectToCart(activeItemForModifiers, resolvedModifiers)
    setActiveItemForModifiers(null)
  }

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === cartItemId) {
              const newQty = item.quantity + delta
              return newQty > 0 ? { ...item, quantity: newQty } : null
            }
            return item
          })
          .filter(Boolean) as CartItem[]
    )
  }

  const handleApplyStaffMeal = () => {
    setIsStaffMeal((prev) => !prev)
    setDiscountPercent(0)
    setCustomDiscountAmount(0)
    if (!isStaffMeal && !staffNote) {
      setStaffNote('Colación Empleado (Cortesía $0)')
    }
  }

  const handleClearCart = () => {
    setCart([])
    setDiscountPercent(0)
    setCustomDiscountAmount(0)
    setIsStaffMeal(false)
    setStaffNote('')
    setCustomerName('')
    setCustomerPhone('')
  }

  // POS Checkout submission
  const handleProcessPosCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('El carrito está vacío.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      // 1. Create POS Order
      const posPayload = {
        locationId: menu.locationId,
        type: orderType,
        customerName: customerName || (isStaffMeal ? 'Empleado / Colación' : 'Cliente Caja'),
        customerPhone: customerPhone || undefined,
        notes: staffNote || undefined,
        discountAmount,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.modifiers.map((m) => ({ modifierId: m.modifierId })),
        })),
      }

      const orderRes = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posPayload),
      })
      const orderResult = await orderRes.json()

      if (!orderRes.ok || orderResult.error) {
        throw new Error(orderResult.error || 'Error al generar la orden en caja.')
      }

      const orderData: OrderWithItems = orderResult.data

      // 2. Pay POS Order and dispatch to Kitchen
      const effectiveMethod = isStaffMeal ? 'STAFF_MEAL' : paymentMethod
      const paidNum = paymentMethod === 'CASH' && cashGiven ? Number(cashGiven) : totalAmount

      const payRes = await fetch('/api/pos/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          method: effectiveMethod,
          amountPaid: paidNum,
          notes: staffNote || undefined,
        }),
      })

      const payResult = await payRes.json()
      if (!payRes.ok || payResult.error) {
        throw new Error(payResult.error || 'Error al procesar el cobro en caja.')
      }

      const confirmedOrderData: OrderWithItems = {
        ...orderData,
        status: 'CONFIRMED',
      }

      setCompletedOrder({
        orderId: orderData.id,
        orderNumber: payResult.data.orderNumber,
        totalAmount: payResult.data.totalAmount,
        amountPaid: payResult.data.amountPaid,
        change: payResult.data.change,
        orderData: confirmedOrderData,
      })

      if (shouldAutoPrintTicket) {
        setActiveTicketToPrint(confirmedOrderData)
      }

      setIsPaymentModalOpen(false)
      handleClearCart()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setErrorMsg(error.message || 'Error inesperado al procesar el pedido.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cash change calculation
  const numCashGiven = Number(cashGiven || 0)
  const cashChange = Math.max(0, numCashGiven - totalAmount)

  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      {/* POS Top Navigation Bar */}
      <header className="bg-card border-border/60 flex items-center justify-between border-b px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl font-black shadow-md">
            POS
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Caja Registradora</h1>
            <p className="text-muted-foreground text-xs">{menu.name}</p>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/cash"
            className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            <Calculator size={16} className="text-primary" />
            Cierre de Caja
          </a>
          <a
            href="/dashboard/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            <ChefHat size={16} className="text-primary" />
            Pantalla de Cocina
          </a>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors"
          >
            <Utensils size={16} className="text-primary" />
            Menú Digital
          </a>
        </div>
      </header>

      {/* Main Content Workspace (Split 2-Column: Catalog + Cart Sidebar) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Menu Catalog */}
        <div className="border-border/60 bg-muted/20 flex flex-1 flex-col overflow-hidden border-r">
          {/* Search & Category Filter Header */}
          <div className="bg-card border-border/40 space-y-3 border-b p-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-3 left-3.5 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="bg-muted/50 border-border/60 placeholder:text-muted-foreground focus:ring-primary/20 w-full rounded-2xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            {/* Category Pills */}
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                Todos ({allItems.length})
              </button>
              {categories.map((cat) => {
                const visibleCount = (cat.items || []).filter(
                  (item) => item.isVisible && item.dailyMenuOverride?.isVisible !== false
                ).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {cat.name} ({visibleCount})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Product Grid Catalog */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="text-muted-foreground flex h-64 flex-col items-center justify-center text-center">
                <Utensils className="mb-2 h-10 w-10 stroke-[1.5] opacity-40" />
                <p className="text-sm font-medium">
                  No se encontraron productos en esta categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredItems.map((item) => {
                  const stockVal = item.dailyMenuOverride?.stockDaily
                  const isAvailable =
                    item.isAvailable &&
                    item.dailyMenuOverride?.isAvailable !== false &&
                    (stockVal === null || stockVal === undefined || stockVal > 0)
                  const cardBgClass = getStockCardBgClass(stockVal)

                  return (
                    <button
                      key={item.id}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && handleItemClick(item)}
                      className={`group ${cardBgClass} border-border/60 flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-left transition-all ${
                        isAvailable
                          ? 'hover:border-primary/50 hover:shadow-md active:scale-[0.98]'
                          : 'cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-foreground line-clamp-2 text-sm font-bold tracking-tight">
                            {item.name}
                          </h3>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {item.modifierGroups &&
                              item.modifierGroups.length > 0 &&
                              isAvailable && (
                                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                                  +Opciones
                                </span>
                              )}
                            {!isAvailable ? (
                              <span className="rounded-md border border-red-500/40 bg-red-600/25 px-1.5 py-0.5 text-[10px] font-black tracking-tight text-red-950 dark:text-red-200">
                                {stockVal === 0 ? 'Stock: 0 (Agotado)' : 'Agotado'}
                              </span>
                            ) : (
                              stockVal !== null &&
                              stockVal !== undefined &&
                              stockVal < 15 && (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tracking-tight ${
                                    stockVal < 4
                                      ? 'border border-red-500/30 bg-red-600/20 text-red-950 dark:text-red-200'
                                      : 'border border-amber-500/30 bg-amber-600/20 text-amber-950 dark:text-amber-200'
                                  }`}
                                >
                                  Stock: {stockVal}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="border-border/30 mt-3 flex items-center justify-between border-t pt-2">
                        <span className="text-foreground text-sm font-black">
                          ${Number(item.price).toLocaleString('es-CL')}
                        </span>
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            isAvailable
                              ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Plus size={16} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Cart & Checkout Drawer Panel */}
        <div className="bg-card flex w-96 flex-col overflow-hidden shadow-xl">
          {/* Cart Header */}
          <div className="border-border/40 space-y-3 border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-primary h-5 w-5" />
                <h2 className="text-base font-extrabold tracking-tight">Detalle del Pedido</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-destructive hover:bg-destructive/10 flex items-center gap-1 rounded-lg p-1.5 text-xs font-semibold transition-colors"
                >
                  <RotateCcw size={13} /> Limpiar
                </button>
              )}
            </div>

            {/* Order Type Tabs */}
            <div className="bg-muted/60 grid grid-cols-3 gap-1 rounded-xl p-1">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  orderType === 'DINE_IN'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Utensils size={13} /> Local
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <ShoppingBag size={13} /> Llevar
              </button>
              <button
                onClick={() => setOrderType('DELIVERY')}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  orderType === 'DELIVERY'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <Truck size={13} /> Delivery
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="mb-2 h-12 w-12 stroke-[1.5] opacity-30" />
                <p className="text-sm font-semibold">El carrito está vacío</p>
                <p className="text-muted-foreground/80 mt-1 max-w-[200px] text-xs">
                  Haz clic en cualquier producto de la carta para agregarlo al pedido.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-muted/40 border-border/40 space-y-2 rounded-xl border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-foreground text-sm leading-tight font-bold">
                        {item.name}
                      </h4>
                      {item.modifiers.length > 0 && (
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          {item.modifiers.map((m) => `+ ${m.name}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-foreground text-sm font-black whitespace-nowrap">
                      $
                      {(
                        (item.price + item.modifiers.reduce((s, m) => s + m.priceExtra, 0)) *
                        item.quantity
                      ).toLocaleString('es-CL')}
                    </span>
                  </div>

                  {/* Quantity and Item Delete controls */}
                  <div className="border-border/20 flex items-center justify-between border-t pt-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="bg-card hover:bg-muted text-foreground border-border/50 flex h-7 w-7 items-center justify-center rounded-lg border font-bold transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="bg-card hover:bg-muted text-foreground border-border/50 flex h-7 w-7 items-center justify-center rounded-lg border font-bold transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.id, -item.quantity)}
                      className="text-destructive hover:bg-destructive/10 ml-auto flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discounts & Employee Meal ("Comida Empleado $0") Panel */}
          {cart.length > 0 && (
            <div className="border-border/40 bg-muted/10 space-y-3 border-t p-4">
              {/* Discount Buttons */}
              <div className="space-y-1.5">
                <label className="text-muted-foreground flex items-center justify-between text-xs font-bold">
                  <span>Descuentos y Cortesías</span>
                  {isStaffMeal && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600 uppercase dark:text-emerald-400">
                      100% Cortesía
                    </span>
                  )}
                </label>

                {/* Staff Meal Special Toggle Button */}
                <button
                  onClick={handleApplyStaffMeal}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-black transition-all ${
                    isStaffMeal
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                  }`}
                >
                  <UserCheck size={16} />
                  {isStaffMeal
                    ? '✓ Comida Empleado ($0 Aplicado)'
                    : 'Comida de Empleado / Cortesía ($0)'}
                </button>

                {/* Percentage Discount Options */}
                {!isStaffMeal && (
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[10, 20, 50].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => {
                          setDiscountPercent(discountPercent === pct ? 0 : pct)
                          setCustomDiscountAmount(0)
                        }}
                        className={`rounded-lg border py-1 text-xs font-bold transition-all ${
                          discountPercent === pct
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const val = prompt('Ingresa monto de descuento fijo ($ CLP):')
                        if (val && !isNaN(Number(val))) {
                          setCustomDiscountAmount(Number(val))
                          setDiscountPercent(0)
                        }
                      }}
                      className={`rounded-lg border py-1 text-xs font-bold transition-all ${
                        customDiscountAmount > 0
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border/50 hover:bg-muted'
                      }`}
                    >
                      {customDiscountAmount > 0 ? `$${customDiscountAmount}` : 'Fijo'}
                    </button>
                  </div>
                )}

                {/* Note / Staff Name Input */}
                <input
                  type="text"
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder={
                    isStaffMeal ? 'Nombre empleado (ej: Juan - Cocina)' : 'Nota / Nombre cliente...'
                  }
                  className="bg-card border-border/60 focus:ring-primary/20 w-full rounded-xl border px-3 py-2 text-xs focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Totals Summary */}
              <div className="border-border/30 space-y-1.5 border-t pt-2 text-xs">
                <div className="text-muted-foreground flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-CL')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Descuento</span>
                    <span>-${discountAmount.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div className="text-foreground border-border/30 flex justify-between border-t pt-1 text-base font-black">
                  <span>TOTAL A PAGAR</span>
                  <span>${totalAmount.toLocaleString('es-CL')}</span>
                </div>
              </div>

              {/* Primary Checkout Button */}
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={cart.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-extrabold shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <DollarSign size={18} />
                {isStaffMeal
                  ? 'Cobrar $0 y Enviar a Cocina'
                  : `Cobrar $${totalAmount.toLocaleString('es-CL')}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modifier Group Selection Modal */}
      {activeItemForModifiers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-card border-border/60 w-full max-w-md space-y-4 rounded-3xl border p-6 shadow-2xl">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-foreground text-base font-bold">
                  {activeItemForModifiers.name}
                </h3>
                <p className="text-muted-foreground text-xs">
                  Selecciona los opcionales o modificadores
                </p>
              </div>
              <button
                onClick={() => setActiveItemForModifiers(null)}
                className="text-muted-foreground hover:bg-muted rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
              {(activeItemForModifiers.modifierGroups || []).map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-xs font-bold">{group.name}</span>
                    {group.isRequired && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
                        Obligatorio
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.modifiers.map((mod) => {
                      const isSelected = (selectedModifiersModal[group.id] || []).includes(mod.id)
                      return (
                        <button
                          key={mod.id}
                          onClick={() => {
                            setSelectedModifiersModal((prev) => ({
                              ...prev,
                              [group.id]: [mod.id], // single select per group for POS simplicity
                            }))
                          }}
                          className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                          }`}
                        >
                          <div>{mod.name}</div>
                          {Number(mod.priceExtra) > 0 && (
                            <span className="text-muted-foreground text-[11px] font-bold">
                              +${Number(mod.priceExtra).toLocaleString('es-CL')}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmModifiersModal}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-2xl py-3 text-xs font-bold shadow-md transition-all"
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      )}

      {/* Payment Checkout Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-card border-border/60 w-full max-w-md space-y-5 rounded-3xl border p-6 shadow-2xl">
            <div className="border-border/40 flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-foreground text-base font-bold">Cobro de Pedido en Caja</h3>
                <p className="text-muted-foreground text-xs">Selecciona la forma de pago</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-muted-foreground hover:bg-muted rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Display */}
            <div className="bg-muted/40 border-border/40 rounded-2xl border p-4 text-center">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Monto Total A Cobrar
              </span>
              <div className="text-foreground mt-1 text-3xl font-black">
                ${totalAmount.toLocaleString('es-CL')} CLP
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                }`}
              >
                <DollarSign size={16} /> Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('CARD_POS')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  paymentMethod === 'CARD_POS'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                }`}
              >
                <CreditCard size={16} /> Tarjeta / POS Físico
              </button>
              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`col-span-2 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/30 border-border/50 text-foreground hover:bg-muted'
                }`}
              >
                <Sparkles size={16} /> Transferencia Bancaria
              </button>
            </div>

            {/* Cash Calculator */}
            {paymentMethod === 'CASH' && (
              <div className="bg-muted/20 border-border/40 space-y-2 rounded-2xl border p-3.5">
                <label className="text-muted-foreground text-xs font-bold">
                  Paga Con (Efectivo Recibido):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={`$${totalAmount}`}
                    className="bg-card border-border/60 focus:ring-primary/20 w-full rounded-xl border px-3 py-2 text-sm font-bold focus:ring-2 focus:outline-none"
                  />
                  <button
                    onClick={() => setCashGiven(String(totalAmount))}
                    className="bg-muted hover:bg-muted/80 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
                  >
                    Exacto
                  </button>
                </div>

                {/* Preset Cash Buttons */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[5000, 10000, 20000, 50000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCashGiven(String(preset))}
                      className="bg-card hover:bg-muted border-border/40 rounded-lg border py-1.5 text-[11px] font-bold"
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>

                {/* Change / Vuelto */}
                <div className="border-border/30 flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-muted-foreground font-bold">Vuelto a entregar:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ${cashChange.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-3 text-center text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Printing Toggle Option */}
            <label className="text-muted-foreground flex cursor-pointer items-center gap-2 pt-1 text-xs font-bold select-none">
              <input
                type="checkbox"
                checked={shouldAutoPrintTicket}
                onChange={(e) => setShouldAutoPrintTicket(e.target.checked)}
                className="border-border text-primary focus:ring-primary/20 h-4 w-4 rounded"
              />
              <span>Imprimir Comanda Físicamente al Cobrar</span>
            </label>

            {/* Confirm Payment Button */}
            <button
              onClick={handleProcessPosCheckout}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar Cobro y Enviar a Cocina
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Completion Success Dialog */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-card border-border/60 w-full max-w-sm space-y-4 rounded-3xl border p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-foreground text-xl font-black">¡Pedido Cobrado!</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                La comanda{' '}
                <span className="text-foreground font-bold">{completedOrder.orderNumber}</span> ya
                se envió a la pantalla de cocina.
              </p>
            </div>

            {completedOrder.change > 0 && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Vuelto Entregado
                </span>
                <div className="mt-0.5 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${completedOrder.change.toLocaleString('es-CL')}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveTicketToPrint(completedOrder.orderData)}
                className="bg-muted hover:bg-muted/80 text-foreground border-border/60 flex w-full items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-xs font-bold transition-all"
              >
                <Printer size={15} /> Reimprimir Ticket Térmico
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-2xl py-3 text-xs font-bold shadow-md transition-all"
              >
                Continuar Siguiente Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Ticket Printer Modal */}
      {activeTicketToPrint && (
        <KitchenTicketPrinter
          order={activeTicketToPrint}
          onClose={() => setActiveTicketToPrint(null)}
        />
      )}
    </div>
  )
}
