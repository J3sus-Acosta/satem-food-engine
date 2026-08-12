/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CustomReportService } from '@/services/reports/CustomReportService'
import type { IOrderRepository, IReportTemplateRepository } from '@/repositories'
import type { SalesReportQueryResult, ReportTemplateDTO } from '@/types'

describe('Módulo de Reportes Personalizados y Exportación a Excel (Fase 17)', () => {
  let customReportService: CustomReportService
  let mockOrderRepo: any
  let mockTemplateRepo: any

  const sampleReportResult: SalesReportQueryResult = {
    summary: {
      totalOrders: 2,
      totalItemsSold: 3,
      totalGrossSales: 15000,
      totalDiscounts: 2000,
      totalRefunds: 0,
      totalNetSales: 13000,
    },
    rows: [
      {
        id: 'item-1',
        orderId: 'ord-1',
        orderNumber: '#1001',
        createdAt: new Date('2026-08-10T12:00:00Z'),
        orderStatus: 'DELIVERED',
        locationName: 'Sucursal Centro',
        organizationName: 'SATEM Corp',
        customerName: 'Juan Pérez',
        customerPhone: '+56912345678',
        customerEmail: 'juan@satem.cl',
        cashierName: 'Pedro Cajero',
        productName: 'Pizza Familiar',
        sku: 'PZ-FAM',
        categoryName: 'Pizzas',
        quantity: 1,
        unitPrice: 10000,
        subtotal: 10000,
        discountName: 'Convenio Levitas',
        discountType: 'DISCOUNT',
        discountValueType: 'FIXED_AMOUNT',
        discountPercent: 0,
        discountAmount: 2000,
        creditUsed: 0,
        paymentMethod: 'SUMUP',
        paymentStatus: 'PAID',
        grossAmount: 10000,
        orderDiscount: 2000,
        totalPaid: 8000,
        voidStatus: 'Venta Original',
        voidQuantity: 0,
        voidAmount: 0,
        voidReason: '-',
        voidUser: '-',
        voidAuthorizer: '-',
      },
      {
        id: 'item-2',
        orderId: 'ord-2',
        orderNumber: '#1002',
        createdAt: new Date('2026-08-11T15:30:00Z'),
        orderStatus: 'DELIVERED',
        locationName: 'Sucursal Centro',
        organizationName: 'SATEM Corp',
        customerName: 'Maria Silva',
        customerPhone: '+56987654321',
        customerEmail: 'maria@satem.cl',
        cashierName: 'Pedro Cajero',
        productName: 'Bebida 1.5L',
        sku: 'BEB-15',
        categoryName: 'Bebidas',
        quantity: 2,
        unitPrice: 2500,
        subtotal: 5000,
        discountName: '-',
        discountType: '-',
        discountValueType: '-',
        discountPercent: 0,
        discountAmount: 0,
        creditUsed: 0,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        grossAmount: 5000,
        orderDiscount: 0,
        totalPaid: 5000,
        voidStatus: 'Venta Original',
        voidQuantity: 0,
        voidAmount: 0,
        voidReason: '-',
        voidUser: '-',
        voidAuthorizer: '-',
      },
    ],
    pagination: {
      totalRows: 2,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
  }

  const sampleTemplate: ReportTemplateDTO = {
    id: 'tpl-1',
    organizationId: 'org-1',
    locationId: 'loc-1',
    userId: 'usr-1',
    name: 'Ventas Mensuales',
    description: 'Plantilla de prueba',
    reportType: 'SALES_DETAIL',
    isShared: true,
    configuration: {
      visibleColumns: ['createdAt', 'orderNumber', 'productName', 'totalPaid'],
      columnOrder: ['createdAt', 'orderNumber', 'productName', 'totalPaid'],
      filters: { paymentMethod: 'SUMUP' },
      sortBy: 'createdAt',
      sortOrder: 'desc',
      reportType: 'SALES_DETAIL',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    mockOrderRepo = {
      findSalesDetailReport: vi.fn(),
    }
    mockTemplateRepo = {
      findTemplates: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }

    customReportService = new CustomReportService(
      mockOrderRepo as IOrderRepository,
      mockTemplateRepo as IReportTemplateRepository
    )
  })

  it('debe obtener los datos del reporte de detalle de ventas filtrados', async () => {
    mockOrderRepo.findSalesDetailReport.mockResolvedValue(sampleReportResult)

    const result = await customReportService.getSalesDetailReport('org-1', 'loc-1', {
      paymentMethod: 'SUMUP',
    })

    expect(mockOrderRepo.findSalesDetailReport).toHaveBeenCalledWith('org-1', 'loc-1', {
      paymentMethod: 'SUMUP',
    })

    expect(result.summary.totalGrossSales).toBe(15000)
    expect(result.summary.totalDiscounts).toBe(2000)
    expect(result.summary.totalNetSales).toBe(13000)
    expect(result.rows).toHaveLength(2)
  })

  it('debe generar un buffer de Excel (.xlsx) con dos hojas (Detalle y Resumen)', async () => {
    mockOrderRepo.findSalesDetailReport.mockResolvedValue(sampleReportResult)

    const buffer = await customReportService.generateSalesDetailExcelBuffer('org-1', 'loc-1', {}, [
      'createdAt',
      'orderNumber',
      'customerName',
      'totalPaid',
    ])

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.length).toBeGreaterThan(100)
  })

  it('debe gestionar el CRUD de plantillas de reportes correctamente', async () => {
    mockTemplateRepo.findTemplates.mockResolvedValue([sampleTemplate])
    mockTemplateRepo.create.mockResolvedValue(sampleTemplate)
    mockTemplateRepo.delete.mockResolvedValue(true)

    const list = await customReportService.getTemplates('org-1', 'usr-1')
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Ventas Mensuales')

    const created = await customReportService.createTemplate({
      organizationId: 'org-1',
      userId: 'usr-1',
      name: 'Ventas Mensuales',
      configuration: sampleTemplate.configuration,
    })

    expect(created.name).toBe('Ventas Mensuales')

    const deleted = await customReportService.deleteTemplate('tpl-1')
    expect(deleted).toBe(true)
  })
})
