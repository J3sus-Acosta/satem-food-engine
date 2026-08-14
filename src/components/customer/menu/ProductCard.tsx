'use client'

import React from 'react'
import { Sparkles, Compass } from 'lucide-react'
import type { MenuItemWithProduct } from '@/types'

interface ProductCardProps {
  item: MenuItemWithProduct
  onSelect: (item: MenuItemWithProduct) => void
}

export function ProductCard({ item, onSelect }: ProductCardProps) {
  const product = item.productVariant.product
  const override = item.dailyMenuOverride

  // Resolve daily overrides values
  const isHighlighted = override?.isHighlighted ?? false
  const isAvailable =
    item.isAvailable &&
    override?.isAvailable !== false &&
    (override?.stockDaily === null || (override?.stockDaily ?? 0) > 0)
  const price =
    override?.price !== null && override?.price !== undefined
      ? Number(override.price)
      : Number(item.price)

  return (
    <div
      onClick={() => isAvailable && onSelect(item)}
      className={`group bg-card border-border/50 hover:border-border/80 flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        isAvailable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]'
          : 'cursor-not-allowed opacity-55'
      }`}
    >
      {/* Product Image / Thumbnail wrapper */}
      <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden select-none sm:aspect-video">
        {item.imageUrl || product.imageUrl ? (
          <img
            src={item.imageUrl || product.imageUrl || ''}
            alt={item.name || product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        ) : (
          <div className="bg-primary/5 text-primary/70 flex h-full w-full items-center justify-center">
            <Compass className="h-6 w-6 stroke-[1.5] sm:h-7 sm:w-7" />
          </div>
        )}

        {/* Highlights & Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 sm:top-3 sm:left-3">
          {isHighlighted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-950 uppercase shadow-md sm:px-2.5 sm:py-1 sm:text-[10px]">
              <Sparkles size={9} className="fill-current sm:size-[10px]" />
              Recomendado
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-xs">
            <span className="bg-destructive/10 text-destructive border-destructive/20 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase sm:px-3.5 sm:py-1.5 sm:text-xs">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5 p-3 sm:space-y-4 sm:p-4.5">
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-foreground group-hover:text-primary line-clamp-1 text-xs font-bold transition-colors sm:text-sm md:text-base">
              {item.name || product.name}
            </h4>
          </div>
          {item.description && (
            <p className="text-muted-foreground line-clamp-1 text-[11px] leading-snug sm:line-clamp-2 sm:text-xs sm:leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Action footer */}
        <div className="border-border/40 flex flex-wrap items-center justify-between gap-1 border-t pt-2 sm:pt-3">
          <div>
            <span className="text-foreground text-xs font-extrabold sm:text-sm md:text-base">
              ${price.toLocaleString('es-CL')}
            </span>
          </div>

          {isAvailable ? (
            <span className="bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex min-h-[36px] items-center justify-center rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all sm:min-h-[44px] sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs">
              Agregar
            </span>
          ) : (
            <span className="bg-muted/50 text-muted-foreground/60 flex min-h-[36px] items-center justify-center rounded-lg px-2 py-1 text-[10px] font-semibold sm:min-h-[44px] sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
              Agotado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
