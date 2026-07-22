/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Global TypeScript type definitions for SATEM Food Engine.
 *
 * Rules:
 * - ALL types here are INDEPENDENT of Prisma and React.
 * - Enums are string unions (UPPER_CASE) aligned with the Prisma schema.
 * - Monetary amounts are `Money` (number, 2 decimal places). Stored as
 *   Decimal(10,2) in DB; the repository layer handles conversion.
 * - Use `type` for pure aliases; `interface` for extensible shapes.
 * - Never use `any`. Use `unknown` + type guards when type is truly unknown.
 */

// ─── Primitive Aliases ────────────────────────────────────────────────────────

/**
 * Monetary amount in the local currency (e.g., 19.99 CLP).
 * Always use 2 decimal places. Never use float arithmetic on Money directly —
 * perform calculations in integer cents and convert back.
 */
export type Money = number

/**
 * Stock quantity (up to 3 decimal places for weights/volumes).
 */
export type Quantity = number

// ─── Domain Enums ─────────────────────────────────────────────────────────────
// These MUST stay aligned with the Prisma schema enums.

export type OrganizationPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'

export type LocationType = 'RESTAURANT' | 'CAFETERIA' | 'FOOD_TRUCK' | 'DARK_KITCHEN'

export type TaxCategory = 'STANDARD' | 'EXEMPT' | 'REDUCED'

export type OrderStatus =
  'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type PaymentProvider =
  'SUMUP' | 'WEBPAY' | 'STRIPE' | 'MERCADOPAGO' | 'CASH' | 'TRANSFER' | 'CUSTOM' | 'OTHER'

export type KitchenTicketStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

export type ChannelType =
  'WEB' | 'WHATSAPP' | 'TELEGRAM' | 'QR' | 'KIOSK' | 'INSTAGRAM' | 'FACEBOOK' | 'API'

export type ChannelSessionStatus = 'ACTIVE' | 'RESOLVED' | 'ABANDONED' | 'EXPIRED'

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'INTERACTIVE' | 'ORDER'

export type IngredientUnit = 'KG' | 'G' | 'L' | 'ML' | 'UNITS'

export type StockMovementType = 'PURCHASE' | 'SALE' | 'WASTE' | 'ADJUSTMENT' | 'RETURN'

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'KITCHEN'
  | 'CAJERO'
  | 'COCINA'
  | 'OPERADOR'
  | 'LECTURA'

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

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
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── PRODUCT DOMAIN ───────────────────────────────────────────────────────────

export interface Product {
  id: string
  organizationId: string
  sku: string | null
  slug: string | null
  name: string
  description: string | null
  shortDescription: string | null
  longDescription: string | null
  imageUrl: string | null
  /** Suggested retail price. The effective price is on MenuItem. */
  basePrice: Money | null
  cost: Money | null
  isAlcoholic: boolean
  taxCategory: TaxCategory
  isActive: boolean
  visibleByDefault: boolean
  highlightedByDefault: boolean
  estimatedPrepTime: number | null
  notes: string | null
  sortOrder: number
  metadata: Record<string, unknown>
  defaultCategoryId: string | null
  defaultCategoryName: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string | null
  isDefault: boolean
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ModifierGroup {
  id: string
  productId: string
  name: string
  description: string | null
  minSelect: number
  maxSelect: number
  isRequired: boolean
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Modifier {
  id: string
  modifierGroupId: string
  name: string
  priceExtra: Money
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

export interface ProductWithFull extends ProductWithVariants {
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[]
  ingredients: ProductIngredient[]
}

export interface CreateProductInput {
  organizationId: string
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  longDescription?: string
  imageUrl?: string
  sku?: string
  basePrice?: Money
  cost?: Money
  isAlcoholic?: boolean
  taxCategory?: TaxCategory
  isActive?: boolean
  visibleByDefault?: boolean
  highlightedByDefault?: boolean
  estimatedPrepTime?: number
  notes?: string
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export interface UpdateProductInput {
  name?: string
  slug?: string | null
  description?: string | null
  shortDescription?: string | null
  longDescription?: string | null
  imageUrl?: string | null
  sku?: string | null
  basePrice?: Money | null
  cost?: Money | null
  isAlcoholic?: boolean
  taxCategory?: TaxCategory
  isActive?: boolean
  visibleByDefault?: boolean
  highlightedByDefault?: boolean
  estimatedPrepTime?: number | null
  notes?: string | null
  sortOrder?: number
  metadata?: Record<string, unknown>
}

export interface CreateProductVariantInput {
  productId: string
  name: string
  sku?: string
  isDefault?: boolean
  sortOrder?: number
}

// ─── MENU / CATALOG DOMAIN ────────────────────────────────────────────────────

export interface Menu {
  id: string
  locationId: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  validFrom: Date | null
  validUntil: Date | null
  schedule: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Category {
  id: string
  menuId: string
  name: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface DailyMenuRowInput {
  Código: string
  Disponible: string
  Visible: string
  Precio?: string | number | null
  Stock?: string | number | null
  Destacado: string
  Orden?: string | number | null
  Nota?: string | null
}

export interface DailyMenuPreviewItem {
  code: string
  name: string
  before: {
    price: number
    isAvailable: boolean
    isVisible: boolean
    sortOrder: number
    isHighlighted: boolean
    stockDaily: number | null
    notes: string | null
  }
  after: {
    price: number
    isAvailable: boolean
    isVisible: boolean
    sortOrder: number
    isHighlighted: boolean
    stockDaily: number | null
    notes: string | null
  }
}

export interface DailyMenuOverride {
  id: string
  menuItemId: string
  price: Money | null
  isAvailable: boolean | null
  stockDaily: number | null
  isHighlighted: boolean
  isVisible: boolean | null
  sortOrder: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MenuItem {
  id: string
  categoryId: string
  productVariantId: string
  /** Override of ProductVariant/Product name for this menu. */
  name: string | null
  description: string | null
  imageUrl: string | null
  /** Effective price for this menu and location. */
  price: Money
  isAvailable: boolean
  isVisible: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  dailyMenuOverride?: DailyMenuOverride | null
}

export interface MenuItemWithProduct extends MenuItem {
  productVariant: ProductVariant & { product: Product }
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[]
}

export interface CategoryWithItems extends Category {
  items: MenuItemWithProduct[]
}

export interface MenuWithCategories extends Menu {
  categories: CategoryWithItems[]
}

// ─── ORDER DOMAIN ─────────────────────────────────────────────────────────────

export interface Order {
  id: string
  orderNumber: string
  locationId: string
  /** Null for guest checkout. Linked retroactively when customer identifies. */
  customerId: string | null
  channelId: string
  status: OrderStatus
  type: OrderType
  tableIdentifier: string | null
  notes: string | null
  subtotal: Money
  taxAmount: Money
  discountAmount: Money
  totalAmount: Money
  confirmedAt: Date | null
  preparedAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
  cancellationReason: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  payment?: Payment
}

export interface OrderItem {
  id: string
  orderId: string
  /** FK for audit only — never use for price calculation. */
  menuItemId: string
  /** FK for audit only — identifies what variant was ordered. */
  productVariantId: string
  /** Snapshot: name at the time of order. */
  name: string
  /** Snapshot: unit price at the time of order. */
  unitPrice: Money
  quantity: number
  /** unitPrice × quantity + sum of modifier priceExtra. */
  subtotal: Money
  notes: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface OrderItemModifier {
  id: string
  orderItemId: string
  /** FK for audit only. */
  modifierId: string
  /** Snapshot: name at the time of order. */
  name: string
  /** Snapshot: priceExtra at the time of order. */
  priceExtra: Money
  createdAt: Date
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { modifiers: OrderItemModifier[] })[]
}

export interface OrderDetailed extends OrderWithItems {
  payment?: Payment
}

export interface CreateOrderInput {
  locationId: string
  channelId: string
  customerId?: string
  type?: OrderType
  tableIdentifier?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface AddOrderItemInput {
  menuItemId: string
  productVariantId: string
  quantity: number
  notes?: string
  modifiers?: Array<{
    modifierId: string
    name: string
    priceExtra: Money
  }>
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus | OrderStatus[]
  type?: OrderType
  from?: Date
  to?: Date
  channelId?: string
  customerId?: string
}

// ─── PAYMENT DOMAIN ───────────────────────────────────────────────────────────

export interface Payment {
  id: string
  orderId: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: Money
  currency: string
  externalId: string | null
  externalReference: string | null
  paidAt: Date | null
  failureReason: string | null
  receiptUrl: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentInput {
  orderId: string
  provider: PaymentProvider
  amount: Money
  currency: string
}

export interface ConfirmPaymentInput {
  externalId: string
  externalReference?: string
  receiptUrl?: string
  paidAt: Date
  metadata?: Record<string, unknown>
}

export interface InitiatePaymentResult {
  payment: Payment
  orderNumber: string
  checkoutUrl: string
  expiresAt?: Date
  estimatedPreparationTime?: number // in minutes
}

/**
 * Resultado de la resolución de configuración de proveedor de pago por tenant.
 * Retornado por ITenantConfigurationRepository.resolvePaymentConfig().
 *
 * Jerarquía de resolución:
 *   Location.paymentProvider/paymentConfiguration
 *   → Organization.paymentProvider/paymentConfiguration
 *   → process.env.PAYMENT_PROVIDER
 *   → 'SUMUP' (fallback)
 *
 * paymentConfiguration nunca se fusiona entre niveles.
 * Se usa la primera configuración encontrada en la jerarquía.
 */
export interface PaymentConfiguration {
  /** Proveedor resuelto tras aplicar la jerarquía completa. */
  provider: PaymentProvider
  /**
   * Configuración específica del proveedor (clave-valor de strings).
   * Vacío ({}) cuando ningún nivel de la jerarquía tiene configuración.
   * NUNCA es null — siempre se retorna al menos {}.
   */
  configuration: Record<string, string>
}

// ─── KITCHEN DOMAIN ───────────────────────────────────────────────────────────

export interface KitchenTicket {
  id: string
  orderId: string
  status: KitchenTicketStatus
  printedAt: Date | null
  startedAt: Date | null
  completedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface KitchenTicketItem {
  id: string
  kitchenTicketId: string
  orderItemId: string
  quantity: number
}

export interface KitchenTicketWithItems extends KitchenTicket {
  items: KitchenTicketItem[]
}

// ─── INVENTORY DOMAIN ─────────────────────────────────────────────────────────

export interface Ingredient {
  id: string
  organizationId: string
  name: string
  unit: IngredientUnit
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface InventoryItem {
  id: string
  locationId: string
  ingredientId: string
  /** Current stock in the ingredient's unit. */
  quantity: Quantity
  /** Threshold for low-stock alerts. */
  minQuantity: Quantity
  createdAt: Date
  updatedAt: Date
}

export interface InventoryItemWithIngredient extends InventoryItem {
  ingredient: Ingredient
}

export interface StockMovement {
  id: string
  inventoryItemId: string
  type: StockMovementType
  /** Positive = inbound, negative = outbound. */
  quantity: Quantity
  reason: string | null
  orderId: string | null
  userId: string | null
  createdAt: Date
}

export interface CreateStockMovementInput {
  inventoryItemId: string
  type: StockMovementType
  quantity: Quantity
  reason?: string
  orderId?: string
  userId?: string
}

// ─── CUSTOMER DOMAIN ──────────────────────────────────────────────────────────

export interface Customer {
  id: string
  organizationId: string
  /** E.164 format: "+56912345678". Primary cross-channel identifier. */
  phone: string | null
  email: string | null
  name: string | null
  avatarUrl: string | null
  isBlocked: boolean
  /** Internal staff note — not visible to the customer. */
  notes: string | null
  /** External IDs: { whatsappId, telegramId, instagramId, ... } */
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface LoyaltyAccount {
  id: string
  customerId: string
  organizationId: string
  points: number
  /** Historical total spent — used for tier calculation. */
  totalSpent: Money
  tier: LoyaltyTier | null
  createdAt: Date
  updatedAt: Date
}

export interface CustomerWithLoyalty extends Customer {
  loyaltyAccount: LoyaltyAccount | null
}

export interface CreateCustomerInput {
  organizationId: string
  phone?: string
  email?: string
  name?: string
  metadata?: Record<string, unknown>
}

export interface UpdateCustomerInput {
  phone?: string | null
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
}

export interface FindOrCreateCustomerInput {
  organizationId: string
  phone?: string
  email?: string
  name?: string
}

// ─── CHANNEL DOMAIN ───────────────────────────────────────────────────────────

export interface Channel {
  id: string
  locationId: string
  type: ChannelType
  name: string
  isActive: boolean
  /** Channel-specific config, validated with Zod in services/channels. */
  config: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ChannelSession {
  id: string
  channelId: string
  customerId: string | null
  /** Native ID in the external channel (e.g., WhatsApp conversation ID). */
  externalId: string
  status: ChannelSessionStatus
  /** Chatbot state machine context: { step, cart, lastIntent, ... } */
  context: Record<string, unknown> | null
  startedAt: Date
  resolvedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Message {
  id: string
  channelSessionId: string
  role: MessageRole
  content: string
  type: MessageType
  metadata: Record<string, unknown> | null
  createdAt: Date
}

// ─── CATALOG MASTER DOMAIN (FASE 10B) ──────────────────────────────────────────

export interface ProductVersion {
  id: string
  productId: string
  versionNumber: number
  createdAt: Date
  userId: string | null
  changeReason: string | null
  productSnapshot: Record<string, any>
  variantsSnapshot: Record<string, any>[]
  modifiersSnapshot: Record<string, any>[]
  ingredientsSnapshot: Record<string, any>[]
  pricesSnapshot: Record<string, any>
  configSnapshot: Record<string, any>
}

export interface CatalogAuditLog {
  id: string
  productId: string
  event: string
  details: Record<string, any> | null
  userId: string | null
  createdAt: Date
}

export interface ProductIngredient {
  id: string
  productId: string
  ingredientId: string
  quantity: number
  cost: number
  ingredient?: {
    name: string
    unit: string
  }
}

export interface ProductCatalogListFilters {
  status?: 'all' | 'active' | 'inactive' | 'deleted'
  hasImage?: 'all' | 'with' | 'without'
  hasVariants?: 'all' | 'with' | 'without'
  hasModifiers?: 'all' | 'with' | 'without'
  search?: string
  sortBy?: 'name' | 'sku' | 'basePrice' | 'updatedAt' | 'sortOrder'
  sortOrder?: 'asc' | 'desc'
}

export interface User {
  id: string
  organizationId: string
  locationId: string | null
  name: string
  username: string
  email: string | null
  avatarUrl: string | null
  role: UserRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export * from './checkout'
export * from './payment'
