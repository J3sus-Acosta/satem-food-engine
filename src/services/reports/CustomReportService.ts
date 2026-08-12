import 'server-only'

import ExcelJS from 'exceljs'
import type { IOrderRepository, IReportTemplateRepository } from '@/repositories'
import type {
  SalesReportQueryFilters,
  SalesReportQueryResult,
  SalesDetailReportColumnKey,
  ReportTemplateDTO,
  ReportTemplateConfiguration,
} from '@/types'

export const COLUMN_LABELS: Record<SalesDetailReportColumnKey, string> = {
  orderNumber: 'Número de Pedido',
  orderId: 'ID Pedido',
  createdAt: 'Fecha / Hora',
  orderStatus: 'Estado Pedido',
  locationName: 'Local',
  organizationName: 'Organización',
  customerName: 'Cliente',
  customerPhone: 'Teléfono',
  customerEmail: 'Email',
  cashierName: 'Cajero / Usuario',
  productName: 'Producto',
  sku: 'SKU',
  categoryName: 'Categoría',
  quantity: 'Cantidad',
  unitPrice: 'Precio Unitario',
  subtotal: 'Subtotal Producto',
  discountName: 'Nombre Descuento',
  discountType: 'Tipo Descuento',
  discountValueType: 'Modalidad Descuento',
  discountPercent: 'Porcentaje %',
  discountAmount: 'Monto Descontado',
  creditUsed: 'Crédito Usado',
  paymentMethod: 'Método de Pago',
  paymentStatus: 'Estado Pago',
  grossAmount: 'Monto Bruto Pedido',
  orderDiscount: 'Descuento Pedido',
  totalPaid: 'Total Pagado Pedido',
  voidStatus: 'Estado Devolución / Anulación',
  voidQuantity: 'Cant. Devuelta',
  voidAmount: 'Monto Devuelto',
  voidReason: 'Motivo Devolución',
  voidUser: 'Usuario Operación',
  voidAuthorizer: 'Autorizador Administrador',
}

export const DEFAULT_VISIBLE_COLUMNS: SalesDetailReportColumnKey[] = [
  'createdAt',
  'orderNumber',
  'customerName',
  'cashierName',
  'productName',
  'quantity',
  'discountAmount',
  'paymentMethod',
  'totalPaid',
]

export class CustomReportService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly templateRepo: IReportTemplateRepository
  ) {}

  async getSalesDetailReport(
    organizationId: string,
    locationId: string | undefined,
    filters: SalesReportQueryFilters
  ): Promise<SalesReportQueryResult> {
    return this.orderRepo.findSalesDetailReport(organizationId, locationId, filters)
  }

  async generateSalesDetailExcelBuffer(
    organizationId: string,
    locationId: string | undefined,
    filters: SalesReportQueryFilters,
    visibleColumns: SalesDetailReportColumnKey[] = DEFAULT_VISIBLE_COLUMNS
  ): Promise<Buffer> {
    // Fetch full matching dataset without pagination limits for full Excel export
    const fullReport = await this.orderRepo.findSalesDetailReport(organizationId, locationId, {
      ...filters,
      page: 1,
      pageSize: 50000,
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SATEM Food Engine'
    workbook.lastModifiedBy = 'SATEM Food Engine'
    workbook.created = new Date()

    // ─── Sheet 1: Detalle de Ventas ─────────────────────────────────────────────
    const sheetDetalle = workbook.addWorksheet('Detalle de Ventas', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    // Setup headers based on selected visible columns
    const columnsConfig = visibleColumns.map((colKey) => {
      const header = COLUMN_LABELS[colKey] || colKey
      let width = 18
      if (['productName', 'customerName', 'discountName', 'voidReason'].includes(colKey)) width = 28
      if (['orderId', 'createdAt', 'customerEmail'].includes(colKey)) width = 22
      if (['quantity', 'discountPercent', 'voidQuantity'].includes(colKey)) width = 14

      return { key: colKey, header, width }
    })

    sheetDetalle.columns = columnsConfig as Partial<ExcelJS.Column>[]

    // Style header row
    const headerRow = sheetDetalle.getRow(1)
    headerRow.height = 28
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }, // Dark slate
      }
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF334155' } },
      }
    })

    // Enable native Excel filters on headers
    sheetDetalle.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columnsConfig.length },
    }

    // Append rows
    for (const rowData of fullReport.rows) {
      const rowValues: Record<string, string | number | Date> = {}
      for (const colKey of visibleColumns) {
        let val: string | number | Date = rowData[colKey as keyof typeof rowData]
        if (val instanceof Date) {
          val = val.toLocaleString('es-CL')
        }
        rowValues[colKey] = val ?? '-'
      }

      const addedRow = sheetDetalle.addRow(rowValues)
      addedRow.height = 20

      // Format individual cells
      visibleColumns.forEach((colKey, colIdx) => {
        const cell = addedRow.getCell(colIdx + 1)
        cell.font = { name: 'Segoe UI', size: 10 }

        if (
          [
            'unitPrice',
            'subtotal',
            'discountAmount',
            'creditUsed',
            'grossAmount',
            'orderDiscount',
            'totalPaid',
            'voidAmount',
          ].includes(colKey)
        ) {
          cell.numFmt = '$#,##0'
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else if (['quantity', 'discountPercent', 'voidQuantity'].includes(colKey)) {
          cell.numFmt = '#,##0'
          cell.alignment = { horizontal: 'right', vertical: 'middle' }
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' }
        }
      })
    }

    // ─── Sheet 2: Resumen Ejecutivo ──────────────────────────────────────────────
    const sheetResumen = workbook.addWorksheet('Resumen Ejecutivo')
    sheetResumen.columns = [
      { header: 'Métrica / Concepto', key: 'metric', width: 32 },
      { header: 'Valor / Total', key: 'value', width: 22 },
    ]

    const resHeaderRow = sheetResumen.getRow(1)
    resHeaderRow.height = 28
    resHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      }
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    const summaryData = [
      { metric: 'Total de Pedidos', value: fullReport.summary.totalOrders, isCurrency: false },
      { metric: 'Productos Vendidos', value: fullReport.summary.totalItemsSold, isCurrency: false },
      { metric: 'Ventas Brutas', value: fullReport.summary.totalGrossSales, isCurrency: true },
      {
        metric: 'Descuentos Aplicados',
        value: -fullReport.summary.totalDiscounts,
        isCurrency: true,
      },
      {
        metric: 'Devoluciones / Anulaciones',
        value: -fullReport.summary.totalRefunds,
        isCurrency: true,
      },
      { metric: 'Ventas Netas Total', value: fullReport.summary.totalNetSales, isCurrency: true },
    ]

    summaryData.forEach((item) => {
      const r = sheetResumen.addRow({
        metric: item.metric,
        value: item.value,
      })
      r.height = 22
      const c1 = r.getCell(1)
      const c2 = r.getCell(2)

      c1.font = { name: 'Segoe UI', size: 11, bold: true }
      c2.font = { name: 'Segoe UI', size: 11, bold: true }
      if (item.isCurrency) {
        c2.numFmt = '$#,##0'
      } else {
        c2.numFmt = '#,##0'
      }
      c2.alignment = { horizontal: 'right' }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  // ─── Templates Management ───────────────────────────────────────────────────

  async getTemplates(organizationId: string, userId: string): Promise<ReportTemplateDTO[]> {
    return this.templateRepo.findTemplates(organizationId, userId)
  }

  async createTemplate(input: {
    organizationId: string
    locationId?: string | null
    userId: string
    name: string
    description?: string | null
    isShared?: boolean
    configuration: ReportTemplateConfiguration
  }): Promise<ReportTemplateDTO> {
    return this.templateRepo.create(input)
  }

  async updateTemplate(
    id: string,
    input: {
      name?: string
      description?: string | null
      isShared?: boolean
      configuration?: ReportTemplateConfiguration
    }
  ): Promise<ReportTemplateDTO> {
    return this.templateRepo.update(id, input)
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templateRepo.delete(id)
  }
}
