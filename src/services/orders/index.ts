/**
 * Orders Service
 *
 * Responsible for order lifecycle management: creation, status updates,
 * kitchen dispatch, and cancellation.
 *
 * Conventions:
 * - All functions must be pure and testable in isolation.
 * - No direct database access — delegate to repositories (future).
 * - No HTTP logic — that belongs in API Route Handlers (app/api/).
 */
