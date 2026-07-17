import { NextResponse } from 'next/server'
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  IntegrationError,
} from './errors'
import type { ApiResponse } from '@/types'

/**
 * Maps domain errors to HTTP NextResponses with appropriate status codes.
 *
 * Rules:
 * - ValidationError -> 400 Bad Request
 * - NotFoundError -> 404 Not Found
 * - ConflictError -> 409 Conflict
 * - ForbiddenError -> 403 Forbidden
 * - IntegrationError -> 502 Bad Gateway
 * - Any other error -> 500 Internal Server Error
 *
 * @param error - The caught error object
 * @param defaultMessage - Optional fallback error message
 * @param routeName - Optional name/tag of the route for logging purposes
 */
export function handleRouteError(
  error: unknown,
  defaultMessage = 'Error interno del servidor',
  routeName?: string
): NextResponse<ApiResponse<never>> {
  const err = error instanceof Error ? error : new Error(String(error))
  const tag = routeName ? `[${routeName}] ` : ''

  if (err instanceof ValidationError || err.name === 'ValidationError') {
    return NextResponse.json({ error: err.message || defaultMessage }, { status: 400 })
  }

  if (err instanceof NotFoundError || err.name === 'NotFoundError') {
    return NextResponse.json({ error: err.message || defaultMessage }, { status: 404 })
  }

  if (err instanceof ConflictError || err.name === 'ConflictError') {
    return NextResponse.json({ error: err.message || defaultMessage }, { status: 409 })
  }

  if (err instanceof ForbiddenError || err.name === 'ForbiddenError') {
    return NextResponse.json({ error: err.message || defaultMessage }, { status: 403 })
  }

  if (err instanceof IntegrationError || err.name === 'IntegrationError') {
    console.error(`${tag}Integration Error:`, err)
    return NextResponse.json({ error: err.message || defaultMessage }, { status: 502 })
  }

  console.error(`${tag}Unhandled Route Error:`, err)
  return NextResponse.json({ error: defaultMessage || err.message }, { status: 500 })
}
