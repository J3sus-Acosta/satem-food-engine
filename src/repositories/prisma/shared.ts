/**
 * Shared utilities for Prisma repository implementations.
 *
 * This file is SERVER-ONLY. Never import from Client Components.
 *
 * Centralizes helpers shared by multiple Prisma repositories to avoid
 * code duplication and ensure consistent behavior across the persistence layer.
 */
import 'server-only'

/**
 * Detects whether a Prisma error is caused by a DB connection failure
 * (as opposed to a query or constraint error).
 *
 * Used by all Prisma repositories to decide whether to fall back to the
 * in-memory store during local development without a running PostgreSQL instance.
 *
 * @param error - The caught error from a Prisma operation.
 * @returns true if the error is a connection/initialization problem.
 */
export function isConnectionError(error: unknown): boolean {
  if (!error) return false
  const err = error as Record<string, unknown> | null | undefined
  const msg = String(err?.message || '')
  return (
    err?.code === 'P1001' ||
    err?.code === 'P1002' ||
    err?.code === 'P1003' ||
    err?.code === 'P1017' ||
    msg.includes("Can't reach database") ||
    msg.includes('connect ECONNREFUSED') ||
    err?.name === 'PrismaClientInitializationError'
  )
}
