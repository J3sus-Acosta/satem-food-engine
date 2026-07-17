/**
 * n8n Service
 *
 * Responsible for triggering and interacting with n8n automation workflows:
 * sending order comandas to kitchen, inventory alerts, and notifications.
 *
 * Conventions:
 * - All functions must be pure and testable in isolation.
 * - n8n webhook URLs must be accessed via environment variables only.
 * - No HTTP logic — that belongs in API Route Handlers (app/api/).
 */
