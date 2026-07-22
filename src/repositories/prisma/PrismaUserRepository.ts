import 'server-only'

import { db } from '@/server/db'
import { UserRole as PrismaUserRole, Prisma } from '@/generated/prisma'
import type { IUserRepository } from '../interfaces/IUserRepository'
import type { User, UserRole } from '@/types'

export class PrismaUserRepository implements IUserRepository {
  private mapUser(dbUser: {
    id: string
    organizationId: string
    locationId: string | null
    name: string
    username: string
    email: string | null
    avatarUrl: string | null
    role: string
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }): User {
    return {
      id: dbUser.id,
      organizationId: dbUser.organizationId,
      locationId: dbUser.locationId,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role as UserRole,
      isActive: dbUser.isActive,
      lastLoginAt: dbUser.lastLoginAt,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      deletedAt: dbUser.deletedAt,
    }
  }

  async create(data: {
    organizationId: string
    locationId?: string | null
    name: string
    username: string
    email?: string | null
    passwordHash: string
    role: UserRole
    isActive?: boolean
  }): Promise<User> {
    const created = await db.user.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId || null,
        name: data.name,
        username: data.username,
        email: data.email || null,
        passwordHash: data.passwordHash,
        role: data.role as unknown as PrismaUserRole,
        isActive: data.isActive ?? true,
      },
    })
    return this.mapUser(created)
  }

  async update(
    id: string,
    data: {
      locationId?: string | null
      name?: string
      email?: string | null
      role?: UserRole
      isActive?: boolean
    }
  ): Promise<User> {
    const updated = await db.user.update({
      where: { id },
      data: {
        locationId: data.locationId === undefined ? undefined : data.locationId,
        name: data.name,
        email: data.email === undefined ? undefined : data.email,
        role: data.role as unknown as PrismaUserRole,
        isActive: data.isActive,
      },
    })
    return this.mapUser(updated)
  }

  async changePassword(id: string, passwordHash: string): Promise<void> {
    await db.user.update({
      where: { id },
      data: { passwordHash },
    })
  }

  async findById(id: string): Promise<User | null> {
    const found = await db.user.findFirst({
      where: { id, deletedAt: null },
    })
    return found ? this.mapUser(found) : null
  }

  async findByUsername(username: string): Promise<User | null> {
    const found = await db.user.findFirst({
      where: { username, deletedAt: null },
    })
    return found ? this.mapUser(found) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await db.user.findFirst({
      where: { email, deletedAt: null },
    })
    return found ? this.mapUser(found) : null
  }

  async list(
    organizationId: string,
    filters?: {
      search?: string
      role?: UserRole
      isActive?: boolean
      locationId?: string
    }
  ): Promise<User[]> {
    const whereClause: Prisma.UserWhereInput = {
      organizationId,
      deletedAt: null,
    }

    if (filters) {
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive
      }
      if (filters.role !== undefined) {
        whereClause.role = filters.role
      }
      if (filters.locationId !== undefined) {
        whereClause.locationId = filters.locationId
      }
      if (filters.search) {
        const searchLower = filters.search.trim()
        whereClause.OR = [
          { name: { contains: searchLower, mode: 'insensitive' } },
          { username: { contains: searchLower, mode: 'insensitive' } },
          { email: { contains: searchLower, mode: 'insensitive' } },
        ]
      }
    }

    const list = await db.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    })

    return list.map((u) => this.mapUser(u))
  }

  async delete(id: string): Promise<void> {
    await db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async getPasswordHash(id: string): Promise<string | null> {
    const found = await db.user.findFirst({
      where: { id, deletedAt: null },
      select: { passwordHash: true },
    })
    return found ? found.passwordHash : null
  }
}
