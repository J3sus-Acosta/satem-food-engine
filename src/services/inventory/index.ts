/**
 * Inventory Service
 *
 * Responsible for stock level management: deductions on order completion,
 * alerts on low stock, and restock tracking.
 *
 * Conventions:
 * - All functions must be pure and testable in isolation.
 * - No direct database access — delegate to repositories (future).
 * - No HTTP logic — that belongs in API Route Handlers (app/api/).
 */
