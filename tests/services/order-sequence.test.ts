/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PrismaOrderRepository,
  getPureBusinessDate,
} from '@/repositories/prisma/PrismaOrderRepository'

// Mock `db` instance to test OrderSequence isolation
vi.mock('@/server/db', () => {
  const sequencesStore: any[] = []
  const ordersStore: any[] = []

  return {
    db: {
      orderSequence: {
        findFirst: vi.fn(),
      },
      order: {
        findFirst: vi.fn(() => {
          throw new Error('NUNCA se debe consultar la tabla Order para calcular orderNumber')
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          orderSequence: {
            findFirst: vi.fn(async ({ where }: any) => {
              if (!where) return null
              if (where.locationId && where.businessDate) {
                const dateStr = where.businessDate.toISOString().split('T')[0]
                return (
                  sequencesStore.find(
                    (s) => s.locationId === where.locationId && s.businessDateStr === dateStr
                  ) || null
                )
              }
              if (where.locationId) {
                const matches = sequencesStore.filter((s) => s.locationId === where.locationId)
                if (matches.length === 0) return null
                matches.sort((a, b) => b.lastNumber - a.lastNumber)
                return matches[0]
              }
              return null
            }),
            upsert: vi.fn(async ({ where, update, create }: any) => {
              const { locationId, businessDate } = where.locationId_businessDate
              const dateStr = businessDate.toISOString().split('T')[0]

              let seq = sequencesStore.find(
                (s) => s.locationId === locationId && s.businessDateStr === dateStr
              )

              if (seq) {
                if (update.lastNumber?.increment) {
                  seq.lastNumber += update.lastNumber.increment
                }
              } else {
                seq = {
                  id: `seq_${Date.now()}_${Math.random()}`,
                  locationId,
                  businessDate,
                  businessDateStr: dateStr,
                  lastNumber: create.lastNumber,
                }
                sequencesStore.push(seq)
              }

              return { ...seq }
            }),
          },
          order: {
            findFirst: vi.fn(() => {
              throw new Error('NUNCA se debe consultar la tabla Order para calcular orderNumber')
            }),
            create: vi.fn(async ({ data }: any) => {
              const created = {
                id: `ord_${ordersStore.length + 1}`,
                ...data,
                subtotal: 0,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
              }
              ordersStore.push(created)
              return created
            }),
          },
        }
        return callback(tx)
      }),
    },
  }
})

describe('OrderSequence & PrismaOrderRepository (Fase 10B Definitivo)', () => {
  let orderRepo: PrismaOrderRepository

  beforeEach(() => {
    orderRepo = new PrismaOrderRepository()
  })

  it('debe generar secuencialmente #001, #002 y #003', async () => {
    const locationId = 'loc-seq-test-1'
    const channelId = 'chan-1'

    const o1 = await orderRepo.create({ locationId, channelId })
    const o2 = await orderRepo.create({ locationId, channelId })
    const o3 = await orderRepo.create({ locationId, channelId })

    expect(o1.orderNumber).toBe('#001')
    expect(o2.orderNumber).toBe('#002')
    expect(o3.orderNumber).toBe('#003')
  })

  it('debe mantener secuencias independientes para dos sucursales distintas', async () => {
    const locA = 'loc-branch-alpha'
    const locB = 'loc-branch-beta'

    const oA1 = await orderRepo.create({ locationId: locA, channelId: 'chan-1' })
    const oB1 = await orderRepo.create({ locationId: locB, channelId: 'chan-1' })
    const oA2 = await orderRepo.create({ locationId: locA, channelId: 'chan-1' })

    expect(oA1.orderNumber).toBe('#001')
    expect(oB1.orderNumber).toBe('#001')
    expect(oA2.orderNumber).toBe('#002')
  })

  it('debe utilizar fechas de negocio puras (YYYY-MM-DD 00:00:00.000Z) inmunes a zonas horarias', () => {
    const date1 = new Date('2026-07-20T23:59:59.999-04:00')
    const pureDate1 = getPureBusinessDate(date1)
    expect(pureDate1.toISOString()).toBe('2026-07-21T00:00:00.000Z')

    const date2 = new Date('2026-07-20T00:00:01.000Z')
    const pureDate2 = getPureBusinessDate(date2)
    expect(pureDate2.toISOString()).toBe('2026-07-20T00:00:00.000Z')
  })

  it('debe confirmar que NUNCA se consulta la tabla Orders para generar el número de pedido', async () => {
    const locationId = 'loc-no-orders-query'
    // The mocked db.order.findFirst throws if called
    await expect(orderRepo.create({ locationId, channelId: 'chan-1' })).resolves.toBeDefined()
  })

  it('debe soportar alta concurrencia simulada con Promise.all sin colisiones', async () => {
    const locationId = 'loc-concurrency-seq'
    const CONCURRENT_COUNT = 15

    const tasks = Array.from({ length: CONCURRENT_COUNT }).map(() =>
      orderRepo.create({ locationId, channelId: 'chan-1' })
    )

    const results = await Promise.all(tasks)
    const orderNumbers = results.map((r) => r.orderNumber)

    expect(new Set(orderNumbers).size).toBe(CONCURRENT_COUNT)
  })
})
