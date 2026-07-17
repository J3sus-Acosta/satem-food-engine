/**
 * Payments Service
 *
 * Responsible for payment processing: intent creation, status verification,
 * refunds, and webhook event handling from payment providers.
 *
 * Conventions:
 * - All functions must be pure and testable in isolation.
 * - No direct database access — delegate to repositories (future).
 * - No HTTP logic — that belongs in API Route Handlers (app/api/).
 * - Never log or expose raw payment credentials.
 */
