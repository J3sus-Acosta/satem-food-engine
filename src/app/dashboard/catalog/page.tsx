/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { TenantResolver } from '@/server/tenant-resolver'
import { productCatalogService } from '@/services'
import CatalogDashboardClient from './CatalogDashboardClient'

interface PageProps {
  searchParams: Promise<{ locationId?: string }>
}

export default async function DashboardCatalogPage(props: PageProps) {
  const params = await props.searchParams
  const resolved = await TenantResolver.resolve(params.locationId)
  const organizationId = resolved.organizationId
  const locationId = resolved.locationId

  let categories: { id: string; name: string }[] = []
  let ingredients: any[] = []
  let errorMsg: string | null = null

  try {
    categories = await productCatalogService.getCategories(organizationId)
    ingredients = await productCatalogService.getIngredients(organizationId)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[DashboardCatalogPage] Error loading catalog data:', error)
    errorMsg = error.message || 'Error al cargar los datos del catálogo'
  }

  return (
    <CatalogDashboardClient
      organizationId={organizationId}
      locationId={locationId}
      categories={categories}
      ingredients={ingredients}
      errorMsg={errorMsg}
    />
  )
}
