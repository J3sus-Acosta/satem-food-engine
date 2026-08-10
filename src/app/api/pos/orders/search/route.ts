import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { handleRouteError } from '@/lib/api'
import type { ApiResponse, OrderWithItems } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<OrderWithItems[]>>> {
  try {
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const query = (searchParams.get('q') || '').trim()

    if (!locationId) {
      return NextResponse.json(
        { error: 'El parámetro "locationId" es requerido.' },
        { status: 400 }
      )
    }

    const whereCondition: Record<string, unknown> = {
      locationId,
      deletedAt: null,
      status: { notIn: ['DRAFT'] },
    }

    if (query) {
      const cleanNum = query.replace('#', '').trim()
      whereCondition.OR = [
        { orderNumber: { contains: cleanNum, mode: 'insensitive' } },
        { id: { equals: query } },
        { notes: { contains: query, mode: 'insensitive' } },
      ]
    }

    const prismaOrders = await db.order.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            modifiers: true,
          },
        },
        payment: true,
      },
    })

    const resultOrders: OrderWithItems[] = prismaOrders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      taxAmount: Number(o.taxAmount),
      discountAmount: Number(o.discountAmount),
      totalAmount: Number(o.totalAmount),
      metadata: (o.metadata as Record<string, unknown> | null) || {},
      items: o.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
        modifiers: i.modifiers.map((m) => ({
          ...m,
          priceExtra: Number(m.priceExtra),
        })),
      })),
      payment: o.payment
        ? {
            ...o.payment,
            amount: Number(o.payment.amount),
            metadata: o.payment.metadata as Record<string, unknown> | null,
          }
        : undefined,
    })) as unknown as OrderWithItems[]

    return NextResponse.json({ data: resultOrders }, { status: 200 })
  } catch (error: unknown) {
    return handleRouteError(
      error,
      'Error al buscar ventas para anulación',
      'GET /api/pos/orders/search'
    )
  }
}
