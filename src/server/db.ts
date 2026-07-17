/**
 * Prisma Client singleton for Next.js.
 *
 * This file is SERVER-ONLY. The `server-only` import guarantees a build-time
 * error if this module is accidentally imported from a Client Component.
 *
 * Pattern: single PrismaClient instance is reused across hot-reloads in
 * development (stored on globalThis) and instantiated once in production.
 *
 * @see https://www.prisma.io/docs/guides/nextjs
 */
import 'server-only'

import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
