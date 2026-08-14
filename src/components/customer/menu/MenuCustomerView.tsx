'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, PackageSearch, Store, MapPin, Clock, Compass } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductCustomizer } from './ProductCustomizer'
import { CartDrawer } from './CartDrawer'
import { OrderStatusModal } from './OrderStatusModal'
import { useCustomerCart } from './CustomerCartProvider'
import type { MenuWithCategories, MenuItemWithProduct } from '@/types'

interface MenuCustomerViewProps {
  menu: MenuWithCategories
  locationName?: string
}

export function MenuCustomerView({ menu, locationName }: MenuCustomerViewProps) {
  const { totalItems, cartSubtotal } = useCustomerCart()

  // Selection states
  const [selectedItem, setSelectedItem] = useState<MenuItemWithProduct | null>(null)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})

  // Menu Title & Description
  const displayLocationName = locationName || 'Tierra Prometida'
  const menuTitle = `Menú Web ${displayLocationName}`
  const menuDescription = 'Carta principal: Comidas Bebidas y Postres que Edifican...'

  // 1. Catálogo destacado (con overrides aplicados)
  const highlightedItems: MenuItemWithProduct[] = []
  menu.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      const isAvailable =
        item.isAvailable &&
        item.dailyMenuOverride?.isAvailable !== false &&
        (item.dailyMenuOverride?.stockDaily === null ||
          (item.dailyMenuOverride?.stockDaily ?? 0) > 0)
      const isHighlighted = item.dailyMenuOverride?.isHighlighted ?? false
      const isVisible = item.isVisible && item.dailyMenuOverride?.isVisible !== false

      if (isHighlighted && isAvailable && isVisible) {
        highlightedItems.push(item)
      }
    })
  })

  // 2. Setup active category tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180 // offset for sticky category navigation header

      let currentActive = ''
      for (const cat of menu.categories) {
        const ref = categoryRefs.current[cat.id]
        if (ref && ref.offsetTop <= scrollPosition) {
          currentActive = cat.id
        }
      }

      if (currentActive) {
        setActiveCategory(currentActive)
      } else if (menu.categories.length > 0) {
        setActiveCategory(menu.categories[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    if (menu.categories.length > 0) {
      setActiveCategory(menu.categories[0].id)
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [menu.categories])

  const scrollToCategory = (categoryId: string) => {
    const ref = categoryRefs.current[categoryId]
    if (ref) {
      const offset = ref.offsetTop - 150 // offset to scroll below sticky header
      window.scrollTo({
        top: offset,
        behavior: 'smooth',
      })
      setActiveCategory(categoryId)
    }
  }

  const handleCardSelect = (item: MenuItemWithProduct) => {
    setSelectedItem(item)
    setIsCustomizerOpen(true)
  }

  // Filter items based on search query and visibility override
  const getFilteredCategories = () => {
    return menu.categories
      .map((cat) => {
        // Exclude menu items hidden by database visibility configuration or daily menu overrides
        const visibleItems = cat.items.filter((item) => {
          const isVisible = item.isVisible && item.dailyMenuOverride?.isVisible !== false
          if (!isVisible) return false

          if (!searchQuery) return true

          const nameMatch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
          const descMatch = (item.description || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
          return nameMatch || descMatch
        })

        return {
          ...cat,
          items: visibleItems,
        }
      })
      .filter((cat) => cat.items.length > 0)
  }

  const filteredCategories = getFilteredCategories()

  return (
    <div className="space-y-6">
      {/* Restaurant Cover Header */}
      <header className="bg-muted border-border/40 relative overflow-hidden border-b py-12 md:py-16">
        {/* Decorative backdrop gradient */}
        <div className="from-primary/10 via-background to-secondary/10 pointer-events-none absolute inset-0 bg-gradient-to-r opacity-60" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center md:flex-row md:items-start md:text-left">
          {/* Logo Badge */}
          <div className="bg-foreground text-background border-border/80 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-lg md:h-24 md:w-24">
            <Store className="h-10 w-10 stroke-[1.5] md:h-12 md:w-12" />
          </div>

          {/* Restaurant details */}
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{menuTitle}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed md:text-base">
              {menuDescription}
            </p>

            {/* Quick meta details */}
            <div className="text-muted-foreground/90 flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium md:justify-start md:text-sm">
              <span className="bg-muted border-border/50 flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <MapPin size={14} className="text-primary" />
                Santiago, Chile
              </span>
              <span className="bg-muted border-border/50 flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <Clock size={14} className="text-primary" />
                Abierto hoy: 12:00 - 22:00
              </span>
            </div>

            {/* Consultar estado del pedido button - 1 line below location & schedule */}
            <div className="flex justify-center pt-2 md:justify-start">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="bg-card hover:bg-muted text-foreground border-border/60 flex min-h-[48px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold shadow-xs transition-all select-none hover:shadow-sm active:scale-95 sm:text-sm"
              >
                <PackageSearch size={18} className="text-primary shrink-0" />
                <span>Consultar estado del pedido</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky categories horizontal navigation & search header */}
      <div className="bg-background/80 border-border/45 sticky top-0 z-30 border-b py-3.5 shadow-sm backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-6xl space-y-4 px-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            {/* Category tabs */}
            <nav className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto scroll-smooth px-4 pb-1 select-none md:mx-0 md:px-0 md:pb-0">
              {menu.categories.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`touch-target-sm flex cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 md:text-sm ${
                      isActive
                        ? 'bg-foreground text-background scale-103 font-bold shadow-sm'
                        : 'bg-muted hover:bg-muted-foreground/5 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </nav>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos en la carta..."
                className="bg-muted border-border/50 focus:border-primary placeholder:text-muted-foreground/60 min-h-[48px] w-full rounded-full border py-2.5 pr-4 pl-10 text-xs transition-all focus:ring-0 focus:outline-none md:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-28">
        {/* Recommended horizontal scroll section (Featured Items) */}
        {!searchQuery && highlightedItems.length > 0 && (
          <section className="space-y-4.5 select-none">
            <div className="flex items-center gap-3">
              <h3 className="text-foreground text-base font-extrabold tracking-tight md:text-lg">
                Recomendados del Chef 🔥
              </h3>
            </div>

            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              {highlightedItems.map((item) => (
                <div key={`feat-${item.id}`} className="w-44 shrink-0 sm:w-64 md:w-72">
                  <ProductCard item={item} onSelect={handleCardSelect} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categories sections */}
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.id] = el
              }}
              className="scroll-mt-24 space-y-4 sm:space-y-6"
            >
              {/* Heading */}
              <div className="flex items-center gap-4 select-none">
                <h3 className="text-foreground text-base font-extrabold tracking-tight sm:text-lg md:text-xl">
                  {cat.name}
                </h3>
                <div className="bg-border/60 h-[1px] flex-1" />
              </div>

              {/* Grid lists: 2 columns on mobile (e.g. iPhone SE), 3 columns on tablet/desktop */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
                {cat.items.map((item) => (
                  <ProductCard key={item.id} item={item} onSelect={handleCardSelect} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-muted/15 border-border/80 flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed py-16 text-center select-none">
            <Compass size={40} className="text-muted-foreground/60 stroke-[1.5]" />
            <h4 className="text-sm font-bold">No encontramos productos</h4>
            <p className="text-muted-foreground max-w-xs text-xs leading-normal">
              Intenta con otra palabra de búsqueda o explora directamente las categorías de la carta
              digital.
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart FAB panel (Visible on mobile/tablet when totalItems > 0) */}
      {totalItems > 0 && (
        <div className="from-background via-background/90 backdrop-blur-3xs fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t to-transparent p-4 pb-5 md:p-6">
          <div className="mx-auto max-w-lg">
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-primary hover:bg-primary/95 text-primary-foreground flex w-full transform cursor-pointer items-center justify-between rounded-xl px-5 py-4 shadow-lg transition-all select-none hover:scale-101"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-primary-foreground/15 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold">
                  {totalItems}
                </div>
                <span className="text-xs font-bold tracking-wider uppercase">Ver mi pedido</span>
              </div>
              <span className="text-xs font-extrabold md:text-sm">
                ${cartSubtotal.toLocaleString('es-CL')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Product Customizer Overlay Dialog */}
      <ProductCustomizer
        item={selectedItem}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

      {/* Drawer Review Panel */}
      <CartDrawer
        locationId={menu.locationId}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Public Order Status Lookup Modal */}
      <OrderStatusModal
        locationId={menu.locationId}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  )
}
