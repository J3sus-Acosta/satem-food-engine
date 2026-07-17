import React from 'react'
import { headers } from 'next/headers'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import { CustomerCartProvider, MenuCustomerView } from '@/components/customer/menu'
import { CustomerOrderProvider } from '@/components/customer/order/CustomerOrderProvider'
import { Store, MapPin, Clock } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ slug?: string; location?: string }>
}

async function resolveLocationSlug(
  searchParams: Promise<{ slug?: string; location?: string }>
): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') || ''

  // 1. Host/Subdomain (e.g. mci-santiago.satem.app -> mci-santiago)
  const parts = host.split('.')
  // Exclude standard domains and localhost port mapping
  if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0]
  }

  // 2. Query Parameter
  const params = await searchParams
  const querySlug = params.slug || params.location
  if (querySlug) {
    return querySlug
  }

  // 3. Environment Variables / Default Config
  return TENANT_CONFIG.defaultLocationSlug
}

export default async function MenuPage({ searchParams }: PageProps) {
  const locationSlug = await resolveLocationSlug(searchParams)

  // Fetch menu directly on the server (zero HTTP overhead)
  const menu = await productService.getMenu(locationSlug)

  return (
    <main className="bg-background flex min-h-screen flex-col">
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
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{menu.name}</h1>
            {menu.description && (
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed md:text-base">
                {menu.description}
              </p>
            )}

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
          </div>
        </div>
      </header>

      {/* Menu Grid and interactive items */}
      <section className="flex-1 py-8">
        <CustomerOrderProvider>
          <CustomerCartProvider>
            <MenuCustomerView menu={menu} />
          </CustomerCartProvider>
        </CustomerOrderProvider>
      </section>

      {/* Premium subtle brand watermark footer */}
      <footer className="bg-muted/20 border-border/45 text-muted-foreground/60 border-t py-8 text-center text-xs">
        <p>© {new Date().getFullYear()} SATEM Food Engine. Todos los derechos reservados.</p>
      </footer>
    </main>
  )
}
