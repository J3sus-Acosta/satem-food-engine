import React from 'react'
import { headers } from 'next/headers'
import { productService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import { CustomerCartProvider, MenuCustomerView } from '@/components/customer/menu'
import { CustomerOrderProvider } from '@/components/customer/order/CustomerOrderProvider'
import { SatemLogo } from '@/components/ui/SatemLogo'

interface PageProps {
  searchParams: Promise<{ slug?: string; location?: string; locationId?: string }>
}

async function resolveLocationSlug(
  searchParams: Promise<{ slug?: string; location?: string }>
): Promise<string | null> {
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

  // 3. Fallback
  return null
}

export default async function PublicMenuPage({ searchParams }: PageProps) {
  const params = await searchParams
  const locationSlug = await resolveLocationSlug(searchParams)
  const locationId = params.locationId || null

  const tenant = await TenantResolver.resolve(locationId || locationSlug)
  const menu = await productService.getMenu(tenant.locationId)

  const location = tenant.locationId
    ? await db.location.findUnique({
        where: { id: tenant.locationId },
        select: { name: true },
      })
    : null

  return (
    <main className="bg-background flex min-h-screen flex-col">
      {/* Menu Grid and interactive items */}
      <section className="flex-1 pb-8">
        <CustomerOrderProvider>
          <CustomerCartProvider>
            <MenuCustomerView menu={menu} locationName={location?.name} />
          </CustomerCartProvider>
        </CustomerOrderProvider>
      </section>

      {/* Premium subtle brand watermark footer */}
      <footer className="bg-muted/20 border-border/45 text-muted-foreground/60 border-t py-8 text-center text-xs">
        <p className="inline-flex items-center justify-center gap-1.5">
          <span>© {new Date().getFullYear()}</span>
          <SatemLogo className="h-3.5 w-auto" />
          <span>Food Engine. Todos los derechos reservados.</span>
        </p>
      </footer>
    </main>
  )
}
