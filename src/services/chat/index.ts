/**
 * Chat Service
 *
 * Responsible for processing incoming chat messages, managing conversation
 * state, and orchestrating responses via the configured AI provider.
 *
 * Conventions:
 * - All functions must be pure and testable in isolation.
 * - No direct database access — delegate to repositories (future).
 * - No HTTP logic — that belongs in API Route Handlers (app/api/).
 */
