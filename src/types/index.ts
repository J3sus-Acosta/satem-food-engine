/**
 * Global TypeScript type definitions for SATEM Food Engine.
 *
 * Rules:
 * - Types shared across multiple features belong here.
 * - Feature-specific types belong colocated with their feature.
 * - Avoid using `any`. Prefer `unknown` when type is truly unknown.
 * - Use `type` for pure type aliases; use `interface` for extensible shapes.
 */

// ─── Domain Enums ────────────────────────────────────────────────────────────

export type OrderStatus =
  'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'

export type ProductCategory = 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side' | 'special'

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
