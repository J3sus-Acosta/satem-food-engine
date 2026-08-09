import 'server-only'

import { db } from '@/server/db'
import { Prisma } from '@/generated/prisma'
import type { IDiscountCreditRepository } from '../interfaces/IDiscountCreditRepository'
import type {
  DiscountCredit,
  CreateDiscountCreditInput,
  UpdateDiscountCreditInput,
  DiscountCreditFilters,
  DiscountCreditType,
  DiscountCreditValueType,
} from '@/types'

export class PrismaDiscountCreditRepository implements IDiscountCreditRepository {
  private map(dbRecord: {
    id: string
    organizationId: string
    locationId: string | null
    name: string
    description: string | null
    type: string
    valueType: string
    value: Prisma.Decimal
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): DiscountCredit {
    return {
      id: dbRecord.id,
      organizationId: dbRecord.organizationId,
      locationId: dbRecord.locationId,
      name: dbRecord.name,
      description: dbRecord.description,
      type: dbRecord.type as DiscountCreditType,
      valueType: dbRecord.valueType as DiscountCreditValueType,
      value: Number(dbRecord.value),
      isActive: dbRecord.isActive,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
      deletedAt: dbRecord.deletedAt,
    }
  }

  async create(data: CreateDiscountCreditInput): Promise<DiscountCredit> {
    const created = await db.discountCredit.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId ?? null,
        name: data.name.trim(),
        description: data.description?.trim() ?? null,
        type: data.type,
        valueType: data.valueType,
        value: data.value,
        isActive: data.isActive ?? true,
      },
    })
    return this.map(created)
  }

  async update(id: string, data: UpdateDiscountCreditInput): Promise<DiscountCredit> {
    const updated = await db.discountCredit.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        description:
          data.description === undefined ? undefined : (data.description?.trim() ?? null),
        type: data.type,
        valueType: data.valueType,
        locationId: data.locationId === undefined ? undefined : (data.locationId ?? null),
        value: data.value,
        isActive: data.isActive,
      },
    })
    return this.map(updated)
  }

  async findById(id: string): Promise<DiscountCredit | null> {
    const found = await db.discountCredit.findFirst({
      where: { id, deletedAt: null },
    })
    return found ? this.map(found) : null
  }

  async findMany(filters: DiscountCreditFilters): Promise<DiscountCredit[]> {
    const where: Prisma.DiscountCreditWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.type !== undefined) {
      where.type = filters.type
    }

    if (filters.locationId !== undefined) {
      // Fetch org-wide (null) AND location-specific records
      where.OR = [{ locationId: null }, { locationId: filters.locationId }]
    }

    if (filters.search) {
      const term = filters.search.trim()
      where.name = { contains: term, mode: 'insensitive' }
    }

    const list = await db.discountCredit.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return list.map((r) => this.map(r))
  }

  async findActive(organizationId: string, locationId?: string | null): Promise<DiscountCredit[]> {
    const where: Prisma.DiscountCreditWhereInput = {
      organizationId,
      isActive: true,
      deletedAt: null,
      // Include org-wide (null) and location-specific records
      OR: [{ locationId: null }, ...(locationId ? [{ locationId }] : [])],
    }

    const list = await db.discountCredit.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return list.map((r) => this.map(r))
  }

  async enable(id: string): Promise<DiscountCredit> {
    const updated = await db.discountCredit.update({
      where: { id },
      data: { isActive: true },
    })
    return this.map(updated)
  }

  async disable(id: string): Promise<DiscountCredit> {
    const updated = await db.discountCredit.update({
      where: { id },
      data: { isActive: false },
    })
    return this.map(updated)
  }

  async delete(id: string): Promise<void> {
    await db.discountCredit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })
  }
}
