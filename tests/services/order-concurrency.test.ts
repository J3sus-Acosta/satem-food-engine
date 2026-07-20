/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaOrderRepository } from '@/repositories/prisma/PrismaOrderRepository'

// Mock `db` server instance for OrderSequence concurrency
vi.mock('@/server/db', () => {
  const sequencesStore: any[] = []
  const ordersStore: any[] = []
  let mockTxMutex = Promise.resolve()

  return {
    db: {
      $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
        const previousLock = mockTxMutex
        let releaseLock: () => void = () => {}
        mockTxMutex = new Promise((resolve) => {
          releaseLock = resolve
        })

        await previousLock
        try {
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
          return await callback(tx)
        } finally {
          releaseLock()
        }
      }),
    },
  }
})

describe('PrismaOrderRepository - Concurrencia OrderSequence (Fase 10B)', () => {
  let orderRepo: PrismaOrderRepository

  beforeEach(() => {
    orderRepo = new PrismaOrderRepository()
  })

  it('debe generar correlativos únicos e incrementales bajo solicitudes concurrentes (Promise.all)', async () => {
    const locationId = 'loc-concurrency-test'
    const channelId = 'chan-web-1'
    const CONCURRENT_REQUESTS = 10

    const tasks = Array.from({ length: CONCURRENT_REQUESTS }).map((_, idx) =>
      orderRepo.create({
        locationId,
        channelId,
        type: 'TAKEAWAY',
        metadata: { requestIndex: idx },
      })
    )

    const createdOrders = await Promise.all(tasks)

    expect(createdOrders.length).toBe(CONCURRENT_REQUESTS)

    const orderNumbers = createdOrders.map((o) => o.orderNumber)

    expect(new Set(orderNumbers).size).toBe(CONCURRENT_REQUESTS)

    orderNumbers.forEach((num) => {
      expect(num).toMatch(/^#\d{3,}$/)
    })

    expect(orderNumbers[0]).toBe('#001')
    expect(orderNumbers[9]).toBe('#010')
  })

  it('debe mantener correlativos independientes para sucursales distintas', async () => {
    const locA = 'loc-branch-a'
    const locB = 'loc-branch-b'

    const orderA = await orderRepo.create({ locationId: locA, channelId: 'chan-1' })
    const orderB = await orderRepo.create({ locationId: locB, channelId: 'chan-1' })

    expect(orderA.orderNumber).toBe('#001')
    expect(orderB.orderNumber).toBe('#001')
  })
})
