import 'server-only'

import { PrismaProductCatalogRepository } from '@/repositories/prisma/PrismaProductCatalogRepository'
import { ProductCatalogService } from './ProductCatalogService'

const catalogRepository = new PrismaProductCatalogRepository()
export const productCatalogService = new ProductCatalogService(catalogRepository)
export { ProductCatalogService }
