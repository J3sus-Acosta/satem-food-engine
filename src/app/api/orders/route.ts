import { type NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services'
import type { ApiResponse, Order, OrderStatus, OrderType } from '@/types'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Order>>> {
  try {
    const body = await req.json()
    const { locationId, channelId, customerId, type, tableIdentifier, notes, metadata } = body

    if (!locationId) {
      return NextResponse.json({ error: 'locationId es obligatorio' }, { status: 400 })
    }
    if (!channelId) {
      return NextResponse.json({ error: 'channelId es obligatorio' }, { status: 400 })
    }

    const order = await orderService.createDraftOrder(
      locationId,
      channelId,
      customerId,
      type,
      tableIdentifier,
      notes,
      metadata
    )
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[POST /api/orders] Error creating order draft:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno al crear el pedido borrador' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Order[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId es obligatorio para listar pedidos' },
        { status: 400 }
      )
    }

    const statusParam = searchParams.get('status')
    const typeParam = searchParams.get('type')
    const channelId = searchParams.get('channelId')
    const customerId = searchParams.get('customerId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined

    let status: OrderStatus | OrderStatus[] | undefined = undefined
    if (statusParam) {
      if (statusParam.includes(',')) {
        status = statusParam.split(',') as OrderStatus[]
      } else {
        status = statusParam as OrderStatus
      }
    }

    const orders = await orderService.listOrders(locationId, {
      status,
      type: typeParam as OrderType,
      channelId: channelId || undefined,
      customerId: customerId || undefined,
      limit,
      page,
    })

    return NextResponse.json({ data: orders })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[GET /api/orders] Error listing orders:', err)
    return NextResponse.json(
      { error: err.message || 'Error al obtener la lista de pedidos' },
      { status: 500 }
    )
  }
}
