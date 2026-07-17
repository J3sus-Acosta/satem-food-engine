'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Compass, AlertCircle } from 'lucide-react'
import { ProductDetailModal } from './ProductDetailModal'
import type { MenuWithCategories, MenuItemWithProduct } from '@/types'

interface MenuGridProps {
  menu: MenuWithCategories
}

export function MenuGrid({ menu }: MenuGridProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItemWithProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('')

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})

  // Setup active category tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160 // offset for sticky headers

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
    // Initial check
    if (menu.categories.length > 0) {
      setActiveCategory(menu.categories[0].id)
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [menu.categories])

  const scrollToCategory = (categoryId: string) => {
    const ref = categoryRefs.current[categoryId]
    if (ref) {
      const offset = ref.offsetTop - 140 // offset to scroll below sticky header
      window.scrollTo({
        top: offset,
        behavior: 'smooth',
      })
      setActiveCategory(categoryId)
    }
  }

  const handleCardClick = (item: MenuItemWithProduct) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  // Filter items based on search query
  const getFilteredCategories = () => {
    if (!searchQuery) return menu.categories

    return menu.categories
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          const nameMatch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
          const descMatch = (item.description || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
          return nameMatch || descMatch
        })

        return {
          ...cat,
          items: filteredItems,
        }
      })
      .filter((cat) => cat.items.length > 0)
  }

  const filteredCategories = getFilteredCategories()

  return (
    <div className="space-y-8">
      {/* Sticky Navigation and Search Header */}
      <div className="bg-background/80 border-border/60 sticky top-0 z-40 border-b py-4 shadow-sm backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-6xl space-y-4 px-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            {/* Category horizontal list */}
            <nav className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto scroll-smooth px-4 pb-1 md:mx-0 md:px-0 md:pb-0">
              {menu.categories.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 md:text-sm ${
                      isActive
                        ? 'bg-foreground text-background scale-105 shadow-md'
                        : 'bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </nav>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la carta..."
                className="bg-muted border-border/50 focus:ring-foreground placeholder:text-muted-foreground/75 w-full rounded-full border py-2 pr-4 pl-9 text-xs transition-all focus:ring-1 focus:outline-none md:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Sections */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.id] = el
              }}
              className="scroll-mt-24 space-y-6"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4">
                <h3 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
                  {cat.name}
                </h3>
                <div className="bg-border/50 h-[1px] flex-1" />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cat.items.map((item) => {
                  const product = item.productVariant.product
                  const isAvailable = item.isAvailable

                  return (
                    <div
                      key={item.id}
                      onClick={() => isAvailable && handleCardClick(item)}
                      className={`group bg-card border-border/50 hover:border-border relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg ${
                        !isAvailable ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    >
                      {/* Image / Thumbnail */}
                      <div className="bg-muted relative aspect-video overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name || product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="bg-primary/5 text-primary/80 flex h-full w-full items-center justify-center">
                            <Compass size={24} className="stroke-[1.5]" />
                          </div>
                        )}

                        {!isAvailable && (
                          <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-xs">
                            <span className="bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold">
                              <AlertCircle size={12} />
                              Agotado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info body */}
                      <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-foreground group-hover:text-primary line-clamp-1 text-sm font-bold transition-colors md:text-base">
                              {item.name || product.name}
                            </h4>
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price footer */}
                        <div className="border-border/40 flex items-center justify-between border-t pt-2">
                          <div>
                            <span className="text-muted-foreground block text-xs">Precio</span>
                            <span className="text-foreground text-base font-bold">
                              ${item.price.toLocaleString('es-CL')}
                            </span>
                          </div>
                          {isAvailable && (
                            <span className="bg-secondary text-secondary-foreground group-hover:bg-foreground group-hover:text-background rounded-lg px-3 py-1.5 text-xs font-semibold transition-all">
                              Personalizar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-muted/20 border-border/80 flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed py-20 text-center">
            <Search size={40} className="text-muted-foreground stroke-[1.5]" />
            <h4 className="text-lg font-semibold">No encontramos productos</h4>
            <p className="text-muted-foreground max-w-xs text-sm">
              Intenta buscar con otros términos o explora las categorías del menú.
            </p>
          </div>
        )}
      </div>

      {/* Product Customizer Detail Modal */}
      <ProductDetailModal
        key={selectedItem?.id}
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
