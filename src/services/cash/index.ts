import 'server-only'

import { PrismaCashRepository } from '@/repositories/prisma/PrismaCashRepository'
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'
import { CashService } from './CashService'
import { ReportingService } from './ReportingService'

const cashRepo = new PrismaCashRepository()
const orderRepo = new PrismaOrderRepository()

export const cashService = new CashService(cashRepo, orderRepo)
export const reportingService = new ReportingService(orderRepo)

export { CashService } from './CashService'
export { ReportingService } from './ReportingService'
export type { ReportFilters, ReportResult } from './ReportingService'
