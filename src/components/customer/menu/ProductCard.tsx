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
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
          : 'cursor-not-allowed opacity-55'
      }`}
    >
      {/* Product Image / Thumbnail wrapper */}
      <div className="bg-muted relative aspect-video w-full overflow-hidden select-none">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name || product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        ) : (
          <div className="bg-primary/5 text-primary/70 flex h-full w-full items-center justify-center">
            <Compass size={28} className="stroke-[1.5]" />
          </div>
        )}

        {/* Highlights & Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isHighlighted && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-950 uppercase shadow-md">
              <Sparkles size={10} className="fill-current" />
              Recomendado
            </span>
          )}
        </div>

        {!isAvailable && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-xs">
            <span className="bg-destructive/10 text-destructive border-destructive/20 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="flex flex-1 flex-col justify-between space-y-4 p-4.5">
        <div className="space-y-1.5">
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

        {/* Price & Action footer */}
        <div className="border-border/40 flex items-center justify-between border-t pt-2.5">
          <div>
            <span className="text-foreground text-sm font-extrabold md:text-base">
              ${price.toLocaleString('es-CL')}
            </span>
          </div>

          {isAvailable ? (
            <span className="bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold transition-all">
              Agregar
            </span>
          ) : (
            <span className="bg-muted/50 text-muted-foreground/60 rounded-lg px-3 py-1.5 text-xs font-semibold">
              No disponible
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
