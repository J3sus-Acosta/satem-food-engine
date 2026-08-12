import type { UserRole } from '@/types'
import type { SessionPayload } from './session'
import { ForbiddenError } from './errors'

// ─── Permission Keys ──────────────────────────────────────────────────────────

/**
 * All permission keys available in the system.
 * Each key follows the format: `<module>.<action>`
 *
 * These are NOT stored in DB — they are enforced at the service/API layer
 * via the ROLE_PERMISSIONS mapping below.
 */
export type Permission =
  | 'users.view'
  | 'users.manage'
  | 'discounts.view'
  | 'discounts.manage'
  | 'pos.sell'
  | 'pos.view'
  | 'cash.manage'
  | 'cash.view'
  | 'kitchen.view'
  | 'catalog.view'
  | 'catalog.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'reports.view'
  | 'sales.void'

// ─── Role → Permissions Mapping ───────────────────────────────────────────────

/**
 * Maps each UserRole to the set of permissions it grants.
 * - OWNER has all permissions.
 * - ADMIN has all permissions except super-tenant operations.
 * - MANAGER can view/manage most things except user management and system settings.
 * - CASHIER can sell, view cash, view kitchen, view discounts.
 * - KITCHEN can only see the kitchen screen.
 */
const ALL_PERMISSIONS: Permission[] = [
  'users.view',
  'users.manage',
  'discounts.view',
  'discounts.manage',
  'pos.sell',
  'pos.view',
  'cash.manage',
  'cash.view',
  'kitchen.view',
  'catalog.view',
  'catalog.manage',
  'inventory.view',
  'inventory.manage',
  'reports.view',
  'sales.void',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  MANAGER: [
    'users.view',
    'discounts.view',
    'pos.sell',
    'pos.view',
    'cash.view',
    'kitchen.view',
    'catalog.view',
    'catalog.manage',
    'inventory.view',
    'inventory.manage',
    'reports.view',
  ],
  CASHIER: [
    'discounts.view',
    'pos.sell',
    'pos.view',
    'cash.view',
    'kitchen.view',
    'catalog.view',
    'inventory.view',
    'reports.view',
  ],
  KITCHEN: ['kitchen.view'],
}

// ─── Permission Helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the given role has the specified permission.
 *
 * @param role - The user's role
 * @param permission - The permission key to check
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Returns true if the given role is in the list of allowed roles.
 *
 * @param role - The user's role
 * @param allowedRoles - List of roles that are permitted
 */
export function isAllowedRole(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role)
}

/**
 * Asserts that the current session has at least one of the required permissions.
 * Throws a structured error that API routes can catch and convert to 403.
 *
 * @param session - The current session payload (from requireAuth)
 * @param permission - The permission required to proceed
 * @throws Error with message 'FORBIDDEN' if the session lacks the permission
 *
 * @example
 * const session = await requireAuth()
 * requirePermission(session, 'users.manage')
 */
export function requirePermission(session: SessionPayload, permission: Permission): void {
  const role = session.role as UserRole
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`El rol "${role}" no tiene el permiso "${permission}".`)
  }
}

/**
 * Asserts that the current session has one of the allowed roles.
 * Throws a structured error that API routes can catch and convert to 403.
 *
 * @param session - The current session payload (from requireAuth)
 * @param allowedRoles - Array of roles permitted to perform the action
 * @throws Error with message 'FORBIDDEN' if the role is not in allowedRoles
 */
export function requireRole(session: SessionPayload, allowedRoles: UserRole[]): void {
  const role = session.role as UserRole
  if (!isAllowedRole(role, allowedRoles)) {
    throw new ForbiddenError(`El rol "${role}" no tiene acceso a esta operación.`)
  }
}

/**
 * Human-readable label for each role (Spanish, for display in the UI).
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  CASHIER: 'Cajero',
  KITCHEN: 'Cocina',
}

/**
 * Description for each role (Spanish, for display in role selectors).
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  OWNER: 'Acceso total a toda la organización y configuración del sistema',
  ADMIN: 'Acceso completo: usuarios, catálogo, caja, POS, descuentos e inventario',
  MANAGER: 'Acceso a catálogo, inventario, POS y reportes. Sin gestión de usuarios',
  CASHIER: 'Acceso a POS, cobros, caja y pantalla de cocina',
  KITCHEN: 'Acceso exclusivo a la pantalla de cocina',
}
