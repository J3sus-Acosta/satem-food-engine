import { type NextRequest, NextResponse } from 'next/server'
import { reportingService, cashService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const sessionId = searchParams.get('sessionId') || undefined
    const startStr = searchParams.get('startDate') || undefined
    const endStr = searchParams.get('endDate') || undefined
    const userId = searchParams.get('userId') || undefined
    const channel = searchParams.get('channel') || undefined
    const paymentMethod = searchParams.get('paymentMethod') || undefined
    const orderStatus = searchParams.get('orderStatus') || undefined
    const operatorEmail = searchParams.get('operatorEmail') || 'cajero@satem.cl'

    const resolved = await TenantResolver.resolve(locationId)

    // Log export action to CashAudit
    const user = await db.user.findFirst({ where: { email: operatorEmail, deletedAt: null } })
    if (user) {
      await cashService.logReportAction(
        resolved.organizationId,
        resolved.locationId,
        user.id,
        sessionId,
        'EXPORT_EXCEL',
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      )
    }

    // Resolve date bounds
    let startDate = startStr ? new Date(startStr) : undefined
    let endDate = endStr ? new Date(endStr) : undefined

    if (sessionId) {
      const session = await cashService.getSession(sessionId)
      if (session) {
        startDate = session.openedAt
        endDate = session.closedAt || new Date()
      }
    }

    const report = await reportingService.generateReport({
      organizationId: resolved.organizationId,
      locationId: resolved.locationId,
      sessionId,
      startDate,
      endDate,
      userId,
      channel,
      paymentMethod,
      orderStatus,
    })

    // Generate CSV string
    let csv = '\ufeff' // UTF-8 BOM for Excel Chilean layout
    csv += 'REPORTE FINANCIERO DE CAJA - SATEM FOOD ENGINE\n'
    csv += `Sucursal;${report.metadata.locationName}\n`
    csv += `Operador;${report.metadata.operatorName}\n`
    csv += `Rango;${new Date(report.metadata.startDate).toLocaleString('es-CL')} - ${
      report.metadata.endDate
        ? new Date(report.metadata.endDate).toLocaleString('es-CL')
        : 'Abierto'
    }\n`
    csv += `Pedidos;${report.metadata.ordersCount}\n`
    csv += `Clientes;${report.metadata.customersCount}\n\n`

    csv += 'RESUMEN GENERAL\n'
    csv += `Ventas Totales;$${report.totals.totalSales}\n`
    csv += `Total Neto;$${report.totals.netAmount}\n`
    csv += `IVA;$${report.totals.taxAmount}\n`
    csv += `Descuentos;$${report.totals.discountAmount}\n`
    csv += `Propinas;$${report.totals.tipAmount}\n`
    csv += `Total Cobrado;$${report.totals.totalCollected}\n\n`

    csv += 'VENTAS POR CANAL\n'
    csv += 'Canal;Pedidos;Monto;Porcentaje\n'
    for (const ch of report.channels) {
      csv += `${ch.channel};${ch.ordersCount};$${ch.amount};${ch.percentage}%\n`
    }
    csv += '\n'

    csv += 'VENTAS POR METODO DE PAGO\n'
    csv += 'Metodo;Pagos;Monto;Porcentaje\n'
    for (const p of report.payments) {
      csv += `${p.method};${p.paymentsCount};$${p.amount};${p.percentage}%\n`
    }
    csv += '\n'

    csv += 'PRODUCTOS MAS VENDIDOS\n'
    csv += 'Producto;Cantidad;Monto\n'
    for (const prod of report.products) {
      csv += `${prod.name};${prod.quantity};$${prod.amount}\n`
    }
    csv += '\n'

    csv += 'VENTAS POR CATEGORIA\n'
    csv += 'Categoria;Monto\n'
    for (const cat of report.categories) {
      csv += `${cat.name};$${cat.amount}\n`
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=reporte-caja.csv',
      },
    })
  } catch (err) {
    console.error('[API.cash.report.export] Error:', err)
    return new NextResponse('Error al exportar reporte de caja.', { status: 500 })
  }
}
