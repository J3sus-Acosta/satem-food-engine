/**
 * Domain error types for SATEM Food Engine.
 *
 * These errors are thrown by services and repositories and caught by
 * Route Handlers to map them to appropriate HTTP responses.
 *
 * Rules:
 * - Never expose internal error details to the client in production.
 * - Route Handlers are responsible for mapping domain errors → HTTP codes.
 * - These classes are isomorphic (safe for server and edge runtime).
 */

/**
 * Thrown when a method or feature is defined in the interface but not yet
 * implemented. Used exclusively during scaffolding phases.
 * Should NOT appear in production code.
 */
export class NotImplementedError extends Error {
  readonly method: string

  constructor(method: string) {
    super(`${method}: Not yet implemented`)
    this.name = 'NotImplementedError'
    this.method = method
  }
}

/**
 * Thrown when a requested resource does not exist in the system.
 * Maps to HTTP 404.
 */
export class NotFoundError extends Error {
  readonly entity: string
  readonly id: string

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`)
    this.name = 'NotFoundError'
    this.entity = entity
    this.id = id
  }
}

/**
 * Thrown when input data fails domain validation rules.
 * Maps to HTTP 400.
 */
export class ValidationError extends Error {
  readonly field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * Thrown when an operation conflicts with the current state of a resource.
 * Examples: trying to confirm an already-cancelled order.
 * Maps to HTTP 409.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

/**
 * Thrown when the caller does not have permission for the requested operation.
 * Maps to HTTP 403.
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Thrown when an external integration (n8n, SumUp, etc.) returns an error.
 * Maps to HTTP 502.
 */
export class IntegrationError extends Error {
  readonly provider: string
  readonly originalError?: unknown

  constructor(provider: string, message: string, originalError?: unknown) {
    super(`${provider}: ${message}`)
    this.name = 'IntegrationError'
    this.provider = provider
    this.originalError = originalError
  }
}
