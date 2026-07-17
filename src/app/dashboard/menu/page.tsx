import React from 'react'
import { productService } from '@/services'
import { TENANT_CONFIG } from '@/config'
import MenuDashboardClient from './MenuDashboardClient'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardMenuPage(props: PageProps) {
  const params = await props.searchParams
  const locationId = params.locationId || TENANT_CONFIG.defaultLocationSlug

  let initialMenu = null
  let errorMsg = null

  try {
    initialMenu = await productService.getMenu(locationId)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[DashboardMenuPage] Error loading menu:', error)
    errorMsg = error.message || 'Error desconocido al cargar el menú'
  }

  return (
    <MenuDashboardClient initialMenu={initialMenu} locationId={locationId} errorMsg={errorMsg} />
  )
}
