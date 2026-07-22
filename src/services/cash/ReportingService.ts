import 'server-only'

import type { IOrderRepository } from '@/repositories'
import type { OrderStatus, OrderFilters } from '@/types'
import { db } from '@/server/db'

export interface ReportFilters {
  organizationId: string
  locationId: string
  sessionId?: string
  startDate?: Date
  endDate?: Date
  userId?: string
  channel?: string
  paymentMethod?: string
  orderStatus?: string
}

export interface ReportResult {
  metadata: {
    startDate: Date
    endDate: Date | null
    durationMinutes: number | null
    locationName: string
    operatorName: string
    ordersCount: number
    customersCount: number
  }
  totals: {
    totalSales: number
    netAmount: number
    taxAmount: number
    discountAmount: number
    tipAmount: number
    totalCollected: number
  }
  channels: {
    channel: string
    ordersCount: number
    amount: number
    percentage: number
  }[]
  payments: {
    method: string
    paymentsCount: number
    amount: number
    percentage: number
  }[]
  products: {
    name: string
    quantity: number
    amount: number
  }[]
  categories: {
    name: string
    amount: number
  }[]
}

export class ReportingService {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async generateReport(filters: ReportFilters): Promise<ReportResult> {
    const { locationId, startDate, endDate, userId } = filters

    // 1. Resolve Location and Operator names for report header
    let locationName = 'Sucursal'
    let operatorName = 'Operador'

    if (locationId) {
      const loc = await db.location.findFirst({ where: { id: locationId } })
      if (loc) locationName = loc.name
    }

    if (userId) {
      const usr = await db.user.findFirst({ where: { id: userId } })
      if (usr) operatorName = usr.name
    }

    // 2. Fetch all detailed orders matching parameters
    // Note: If no orderStatus is explicitly requested, we exclude DRAFT, PENDING, CANCELLED
    const statuses = filters.orderStatus
      ? [filters.orderStatus as OrderStatus]
      : (['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] as OrderStatus[])

    const orderFilters: OrderFilters = {
      from: startDate,
      to: endDate,
      status: statuses,
      limit: 5000, // Safe limit for shift reports
    }

    if (filters.channel) {
      orderFilters.channelId = filters.channel
    }

    const orders = await this.orderRepo.findDetailedOrders(locationId, orderFilters)

    // Apply client-side filters for paymentMethod or channel that are not fully mapped in repo filters
    let filteredOrders = orders

    if (filters.paymentMethod) {
      filteredOrders = filteredOrders.filter(
        (o) => o.payment && o.payment.provider === filters.paymentMethod
      )
    }

    // 3. Compute Totals
    let totalSales = 0
    let netAmount = 0
    let taxAmount = 0
    let discountAmount = 0
    let tipAmount = 0
    let totalCollected = 0

    const uniqueCustomers = new Set<string>()

    // Maps for grouping
    const channelSalesMap = new Map<string, { count: number; amount: number }>()
    const paymentSalesMap = new Map<string, { count: number; amount: number }>()
    const productSalesMap = new Map<string, { qty: number; amount: number }>()
    const categorySalesMap = new Map<string, number>()

    for (const order of filteredOrders) {
      totalSales += order.totalAmount
      netAmount += order.subtotal
      taxAmount += order.taxAmount
      discountAmount += order.discountAmount

      // Customer count
      const metadataRecord = order.metadata as Record<string, unknown> | null
      if (order.customerId) {
        uniqueCustomers.add(order.customerId)
      } else if (metadataRecord && typeof metadataRecord.customerPhone === 'string') {
        uniqueCustomers.add(metadataRecord.customerPhone)
      } else {
        uniqueCustomers.add(order.id) // Fallback to order ID
      }

      // Tip amount (propinas in metadata)
      if (metadataRecord && typeof metadataRecord.tipAmount === 'number') {
        tipAmount += metadataRecord.tipAmount
      }

      // Total collected
      if (order.payment && order.payment.status === 'PAID') {
        totalCollected += order.totalAmount
      }

      // 3.1 Group by Channel
      // We resolve the channel type if available (or use the channel ID)
      const channelLabel = order.channelId === 'web-channel' ? 'WEB' : order.channelId
      const chData = channelSalesMap.get(channelLabel) || { count: 0, amount: 0 }
      channelSalesMap.set(channelLabel, {
        count: chData.count + 1,
        amount: chData.amount + order.totalAmount,
      })

      // 3.2 Group by Payment Method
      if (order.payment && order.payment.status === 'PAID') {
        const payMethod = order.payment.provider
        const payData = paymentSalesMap.get(payMethod) || { count: 0, amount: 0 }
        paymentSalesMap.set(payMethod, {
          count: payData.count + 1,
          amount: payData.amount + order.totalAmount,
        })
      }

      // 3.3 Group by Product & Category
      for (const item of order.items) {
        const prodData = productSalesMap.get(item.name) || { qty: 0, amount: 0 }
        productSalesMap.set(item.name, {
          qty: prodData.qty + item.quantity,
          amount: prodData.amount + item.subtotal,
        })

        // Category
        const itemRecord = item as unknown as { categoryName?: string }
        const catName = itemRecord.categoryName || 'General'
        const catAmount = categorySalesMap.get(catName) || 0
        categorySalesMap.set(catName, catAmount + item.subtotal)
      }
    }

    // 4. Format Channel lists
    const channelsList = Array.from(channelSalesMap.entries()).map(([ch, data]) => ({
      channel: ch,
      ordersCount: data.count,
      amount: data.amount,
      percentage: totalSales > 0 ? Number(((data.amount / totalSales) * 100).toFixed(1)) : 0,
    }))

    // 5. Format Payment lists
    const paymentsList = Array.from(paymentSalesMap.entries()).map(([method, data]) => ({
      method,
      paymentsCount: data.count,
      amount: data.amount,
      percentage:
        totalCollected > 0 ? Number(((data.amount / totalCollected) * 100).toFixed(1)) : 0,
    }))

    // 6. Format Product list
    const productsList = Array.from(productSalesMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.qty,
        amount: data.amount,
      }))
      .sort((a, b) => b.quantity - a.quantity) // default order: quantity desc

    // 7. Format Category list
    const categoriesList = Array.from(categorySalesMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Calculate duration
    let durationMinutes = null
    if (startDate && endDate) {
      durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
    }

    return {
      metadata: {
        startDate: startDate || new Date(),
        endDate: endDate || null,
        durationMinutes,
        locationName,
        operatorName,
        ordersCount: filteredOrders.length,
        customersCount: uniqueCustomers.size,
      },
      totals: {
        totalSales,
        netAmount,
        taxAmount,
        discountAmount,
        tipAmount,
        totalCollected,
      },
      channels: channelsList,
      payments: paymentsList,
      products: productsList,
      categories: categoriesList,
    }
  }
}
