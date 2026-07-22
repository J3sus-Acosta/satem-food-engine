/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { cashService, reportingService } from '@/services'
import { TenantResolver } from '@/server/tenant-resolver'
import { db } from '@/server/db'
import type { ReportResult } from '@/services'

interface PrintPageProps {
  searchParams: Promise<{ sessionId?: string; operatorEmail?: string }>
}

export default async function PrintCashPage(props: PrintPageProps) {
  const search = await props.searchParams
  const sessionId = search.sessionId
  const operatorEmail = search.operatorEmail || 'cajero@satem.cl'

  if (!sessionId) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        Error: sessionId es requerido para imprimir.
      </div>
    )
  }

  // Load session details
  let session = null
  let report: ReportResult | null = null
  let errorMsg = null

  try {
    session = await cashService.getSession(sessionId)
    if (session.closingReportSnapshot) {
      report = session.closingReportSnapshot as unknown as ReportResult
    } else {
      // Dynamic fallback
      const resolved = await TenantResolver.resolve(session.locationId)
      report = await reportingService.generateReport({
        organizationId: resolved.organizationId,
        locationId: resolved.locationId,
        startDate: session.openedAt,
        endDate: session.closedAt || new Date(),
        userId: session.userId,
      })
    }
  } catch (err: any) {
    errorMsg = err.message
  }

  if (errorMsg || !session || !report) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'red' }}>
        <h3>Error al cargar reporte de impresión</h3>
        <p>{errorMsg || 'No se pudieron recuperar los datos de la sesión.'}</p>
      </div>
    )
  }

  // Format date Chilean standard
  const openedStr = new Date(session.openedAt).toLocaleString('es-CL')
  const closedStr = session.closedAt
    ? new Date(session.closedAt).toLocaleString('es-CL')
    : 'Abierto'

  return (
    <div className="print-container">
      <style>{`
        @media screen {
          body {
            background-color: #f1f5f9;
            padding: 40px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
          .print-btn {
            display: inline-block;
            margin-bottom: 20px;
            padding: 10px 20px;
            background-color: #0f172a;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
            margin: 0;
            font-family: serif;
            color: black;
            font-size: 12pt;
          }
          .print-container {
            width: 100%;
            padding: 0;
            box-shadow: none;
            border-radius: 0;
          }
          .print-btn {
            display: none;
          }
        }
        .header {
          text-align: center;
          border-bottom: 2px solid black;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 20pt;
          text-transform: uppercase;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 11pt;
        }
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid black;
          padding-bottom: 3px;
          margin-top: 25px;
          margin-bottom: 10px;
        }
        .table-data {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 11pt;
        }
        .table-data th, .table-data td {
          padding: 6px 4px;
          border-bottom: 1px dashed #ccc;
        }
        .table-data th {
          text-align: left;
          border-bottom: 1px solid black;
          font-weight: bold;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .totals-box {
          border: 1px solid black;
          padding: 10px;
          margin-top: 15px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .totals-box div {
          font-size: 11pt;
        }
        .totals-box .bold {
          font-weight: bold;
        }
        .signatures {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
        }
        .signature-line {
          width: 250px;
          text-align: center;
        }
        .signature-line div {
          border-top: 1px solid black;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 10pt;
        }
      `}</style>

      <button onClick={() => window.print()} className="print-btn">
        🖨️ Imprimir Reporte
      </button>

      <div className="header">
        <h1>SATEM Food Engine</h1>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '14pt' }}>Reporte de Cierre de Caja</h2>
      </div>

      <div className="meta-grid">
        <div>
          <strong>Sucursal:</strong> {report.metadata.locationName}
        </div>
        <div>
          <strong>Fecha Negocio:</strong> {new Date(session.openedAt).toLocaleDateString('es-CL')}
        </div>
        <div>
          <strong>Operador:</strong> {report.metadata.operatorName}
        </div>
        <div>
          <strong>Identificador Caja:</strong> {session.registerName}
        </div>
        <div>
          <strong>Apertura:</strong> {openedStr}
        </div>
        <div>
          <strong>Cierre:</strong> {closedStr}
        </div>
        {report.metadata.durationMinutes !== null && (
          <div>
            <strong>Duración Turno:</strong> {report.metadata.durationMinutes} minutos
          </div>
        )}
      </div>

      <div className="section-title">Arqueo de Efectivo</div>
      <table className="table-data">
        <tbody>
          <tr>
            <td>Saldo Apertura (Efectivo)</td>
            <td className="text-right">
              ${Number(session.openingBalance).toLocaleString('es-CL')}
            </td>
          </tr>
          <tr>
            <td>Efectivo Esperado (Ventas + Aportes - Retiros)</td>
            <td className="text-right">
              ${Number(session.expectedBalance || 0).toLocaleString('es-CL')}
            </td>
          </tr>
          <tr>
            <td>Efectivo Real Contado</td>
            <td className="text-right">
              ${Number(session.closingBalance || 0).toLocaleString('es-CL')}
            </td>
          </tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td>Diferencia de Cuadratura</td>
            <td className={`text-right ${Number(session.difference || 0) < 0 ? 'color: red' : ''}`}>
              ${Number(session.difference || 0).toLocaleString('es-CL')}
            </td>
          </tr>
        </tbody>
      </table>

      {session.observations && (
        <div style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: 5 }}>
          Observaciones: &ldquo;{session.observations}&rdquo;
        </div>
      )}

      <div className="section-title">Resumen de Ventas</div>
      <div className="totals-box">
        <div>Ventas Brutas:</div>
        <div className="bold text-right">${report.totals.totalSales.toLocaleString('es-CL')}</div>
        <div>Total Neto:</div>
        <div className="text-right">${report.totals.netAmount.toLocaleString('es-CL')}</div>
        <div>IVA Acumulado:</div>
        <div className="text-right">${report.totals.taxAmount.toLocaleString('es-CL')}</div>
        <div>Descuentos Aplicados:</div>
        <div className="text-right">-${report.totals.discountAmount.toLocaleString('es-CL')}</div>
        <div>Propinas Recibidas:</div>
        <div className="text-right">${report.totals.tipAmount.toLocaleString('es-CL')}</div>
        <div className="bold">Total Recaudado (Pagado):</div>
        <div className="bold text-right" style={{ borderTop: '1px double black' }}>
          ${report.totals.totalCollected.toLocaleString('es-CL')}
        </div>
      </div>

      <div className="section-title">Ventas por Canal</div>
      <table className="table-data">
        <thead>
          <tr>
            <th>Canal</th>
            <th className="text-center">Pedidos</th>
            <th className="text-right">Monto</th>
            <th className="text-right">Part.</th>
          </tr>
        </thead>
        <tbody>
          {report.channels.map((ch, idx) => (
            <tr key={idx}>
              <td>{ch.channel}</td>
              <td className="text-center">{ch.ordersCount}</td>
              <td className="text-right">${ch.amount.toLocaleString('es-CL')}</td>
              <td className="text-right">{ch.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">Ventas por Método de Pago</div>
      <table className="table-data">
        <thead>
          <tr>
            <th>Método</th>
            <th className="text-center">Pagos</th>
            <th className="text-right">Monto</th>
            <th className="text-right">Part.</th>
          </tr>
        </thead>
        <tbody>
          {report.payments.map((p, idx) => (
            <tr key={idx}>
              <td>{p.method}</td>
              <td className="text-center">{p.paymentsCount}</td>
              <td className="text-right">${p.amount.toLocaleString('es-CL')}</td>
              <td className="text-right">{p.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">Productos Más Vendidos</div>
      <table className="table-data">
        <thead>
          <tr>
            <th>Producto</th>
            <th className="text-center">Cantidad</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {report.products.slice(0, 15).map((prod, idx) => (
            <tr key={idx}>
              <td>{prod.name}</td>
              <td className="text-center">{prod.quantity}</td>
              <td className="text-right">${prod.amount.toLocaleString('es-CL')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="signatures">
        <div className="signature-line">
          <div>Firma Cajero</div>
        </div>
        <div className="signature-line">
          <div>Firma Supervisor / Administrador</div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{ __html: 'window.onload = function() { window.print(); };' }}
      />
    </div>
  )
}
