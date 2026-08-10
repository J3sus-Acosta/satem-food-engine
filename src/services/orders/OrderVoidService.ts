import 'server-only'

import { db } from '@/server/db'
import { Prisma } from '@/generated/prisma'
import { verifyPassword } from '@/lib/password-crypto'
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { hasPermission } from '@/lib/permissions'
import type {
  VoidOrderInput,
  VoidOrderResult,
  OrderVoidRecord,
  OrderVoidItemRecord,
  UserRole,
} from '@/types'

export interface AdminAuthResult {
  id: string
  name: string
  username: string
  role: string
}

export class OrderVoidService {
  /**
   * Validates admin authorization credentials against PostgreSQL User table.
   * Performs real PBKDF2 hash verification and role/permission check.
   * Does NOT alter active cashier session or save credentials anywhere.
   */
  async validateAdminAuthorization(
    organizationId: string,
    usernameOrEmail: string,
    passwordInput: string
  ): Promise<AdminAuthResult> {
    const cleanInput = (usernameOrEmail || '').trim().toLowerCase()
    if (!cleanInput) {
      throw new ValidationError('Ingrese el usuario o correo del administrador.')
    }
    if (!passwordInput) {
      throw new ValidationError('Ingrese la contraseña del administrador.')
    }

    const user = await db.user.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { username: { equals: cleanInput, mode: 'insensitive' } },
          { email: { equals: cleanInput, mode: 'insensitive' } },
        ],
      },
    })

    if (!user) {
      throw new ValidationError('Credenciales de administrador incorrectas.')
    }

    if (!user.isActive) {
      throw new ValidationError('El usuario se encuentra deshabilitado.')
    }

    const isMatch = verifyPassword(passwordInput, user.passwordHash)
    if (!isMatch) {
      throw new ValidationError('Credenciales de administrador incorrectas.')
    }

    // Role and permission check
    const isAuthorizedRole =
      user.role === 'ADMIN' ||
      user.role === 'OWNER' ||
      hasPermission(user.role as UserRole, 'sales.void')

    if (!isAuthorizedRole) {
      throw new ForbiddenError('El usuario no tiene autorización para anular ventas.')
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    }
  }

  /**
   * Executes a sale void/return (total or partial) inside an atomic database transaction.
   * Restores inventory stock, adjusts cash session, and records an immutable audit log.
   */
  async executeVoid(input: VoidOrderInput): Promise<VoidOrderResult> {
    const reason = (input.reason || '').trim()
    if (!reason) {
      throw new ValidationError('El motivo de la anulación es obligatorio.')
    }

    if (!input.itemsToReturn || input.itemsToReturn.length === 0) {
      throw new ValidationError('Debe seleccionar al menos un ítem a devolver.')
    }

    // 1. Fetch Order with Location and Items
    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        location: true,
        items: {
          include: {
            productVariant: true,
            modifiers: true,
          },
        },
      },
    })

    if (!order || order.deletedAt) {
      throw new NotFoundError('Order', input.orderId)
    }

    if (order.locationId !== input.locationId) {
      throw new ForbiddenError('La venta no pertenece a la sucursal actual.')
    }

    if (order.status === 'CANCELLED') {
      throw new ValidationError('Esta venta ya fue anulada por completo previamente.')
    }

    // 2. Re-verify Admin Credentials inside transaction context
    const adminUser = await this.validateAdminAuthorization(
      order.location.organizationId,
      input.adminUsernameOrEmail,
      input.adminPasswordInput
    )

    // 3. Fetch Cashier User details
    const cashierUser = await db.user.findUnique({
      where: { id: input.cashierUserId },
      select: { id: true, name: true, username: true },
    })

    if (!cashierUser) {
      throw new NotFoundError('User', input.cashierUserId)
    }

    // 4. Calculate existing returns from order metadata
    const orderMetadata = (order.metadata as Record<string, unknown> | null) || {}
    const existingVoids = (orderMetadata.voids as OrderVoidRecord[] | undefined) || []

    const alreadyReturnedMap: Record<string, number> = {}
    for (const voidRecord of existingVoids) {
      for (const item of voidRecord.items) {
        alreadyReturnedMap[item.orderItemId] =
          (alreadyReturnedMap[item.orderItemId] || 0) + item.quantityReturned
      }
    }

    // 5. Validate return quantities and compute refund amounts
    const totalOrderSubtotal = Number(order.subtotal)
    const totalDiscountAmount = Number(order.discountAmount)
    const discountRatio = totalOrderSubtotal > 0 ? totalDiscountAmount / totalOrderSubtotal : 0

    const itemsToProcess: {
      orderItem: (typeof order.items)[0]
      quantityToReturn: number
      refundAmount: number
    }[] = []

    let totalRefundAmount = 0

    for (const reqItem of input.itemsToReturn) {
      if (reqItem.quantityToReturn <= 0) continue

      const orderItem = order.items.find((i) => i.id === reqItem.orderItemId)
      if (!orderItem) {
        throw new ValidationError(
          `El ítem con ID "${reqItem.orderItemId}" no pertenece a este pedido.`
        )
      }

      const alreadyReturned = alreadyReturnedMap[orderItem.id] || 0
      const availableToReturn = orderItem.quantity - alreadyReturned

      if (reqItem.quantityToReturn > availableToReturn) {
        throw new ValidationError(
          `No se puede devolver ${reqItem.quantityToReturn} unidad(es) de "${orderItem.name}". Máximo disponible: ${availableToReturn}.`
        )
      }

      // Calculate net refund per item accounting for original order discount
      const itemSubtotal = Number(orderItem.subtotal)
      const itemNetPaidUnit = (itemSubtotal / orderItem.quantity) * (1 - discountRatio)
      const itemRefundAmount = Math.round(itemNetPaidUnit * reqItem.quantityToReturn)

      totalRefundAmount += itemRefundAmount

      itemsToProcess.push({
        orderItem,
        quantityToReturn: reqItem.quantityToReturn,
        refundAmount: itemRefundAmount,
      })
    }

    if (itemsToProcess.length === 0) {
      throw new ValidationError('No hay unidades válidas seleccionadas para devolución.')
    }

    const voidId = `void_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const isFullVoid =
      input.isFullVoid ||
      order.items.every((item) => {
        const processed = itemsToProcess.find((p) => p.orderItem.id === item.id)
        const newQty = (alreadyReturnedMap[item.id] || 0) + (processed?.quantityToReturn || 0)
        return newQty >= item.quantity
      })

    const voidType: 'FULL' | 'PARTIAL' = isFullVoid ? 'FULL' : 'PARTIAL'

    const voidItemRecords: OrderVoidItemRecord[] = itemsToProcess.map((p) => ({
      orderItemId: p.orderItem.id,
      name: p.orderItem.name,
      quantityReturned: p.quantityToReturn,
      unitPrice: Number(p.orderItem.unitPrice),
      refundAmount: p.refundAmount,
    }))

    const newVoidRecord: OrderVoidRecord = {
      id: voidId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      voidType,
      totalRefundAmount,
      reason,
      cashierUserId: cashierUser.id,
      cashierUserName: cashierUser.name,
      authorizerUserId: adminUser.id,
      authorizerUserName: adminUser.name,
      items: voidItemRecords,
      createdAt: new Date().toISOString(),
    }

    // 6. Execute atomic transaction in PostgreSQL
    const result = await db.$transaction(async (tx) => {
      // 6.1 Find active CashSession for location
      const activeCashSession = await tx.cashSession.findFirst({
        where: {
          locationId: order.locationId,
          status: 'OPEN',
        },
      })

      // 6.2 Restore inventory stock and log StockMovement
      for (const p of itemsToProcess) {
        const productIngredients = await tx.productIngredient.findMany({
          where: { productId: p.orderItem.productVariant.productId },
        })

        for (const recipe of productIngredients) {
          const restoredQty = Number(recipe.quantity) * p.quantityToReturn

          // Upsert or update InventoryItem for location
          const invItem = await tx.inventoryItem.upsert({
            where: {
              locationId_ingredientId: {
                locationId: order.locationId,
                ingredientId: recipe.ingredientId,
              },
            },
            update: {
              quantity: { increment: restoredQty },
            },
            create: {
              locationId: order.locationId,
              ingredientId: recipe.ingredientId,
              quantity: restoredQty,
              minQuantity: 0,
            },
          })

          // Create StockMovement audit record
          await tx.stockMovement.create({
            data: {
              inventoryItemId: invItem.id,
              type: 'RETURN',
              quantity: restoredQty,
              reason: `Devolución Venta #${order.orderNumber}: ${reason}`,
              orderId: order.id,
              userId: cashierUser.id,
            },
          })
        }
      }

      // 6.3 Register CashMovement if an active cash shift exists
      if (activeCashSession) {
        await tx.cashMovement.create({
          data: {
            sessionId: activeCashSession.id,
            amount: totalRefundAmount,
            type: 'OUT',
            reason: `Devolución/Anulación Venta #${order.orderNumber}: ${reason}`,
          },
        })
      }

      // 6.4 Register CashAudit trail for administration audit
      await tx.cashAudit.create({
        data: {
          organizationId: order.location.organizationId,
          locationId: order.locationId,
          userId: adminUser.id,
          sessionId: activeCashSession?.id || null,
          action: 'EXPORT_EXCEL', // reuse existing action enum
          details: JSON.parse(
            JSON.stringify({
              event: 'SALE_VOID',
              orderId: order.id,
              orderNumber: order.orderNumber,
              voidType,
              totalRefundAmount,
              reason,
              cashierUserId: cashierUser.id,
              cashierUserName: cashierUser.name,
              authorizerUserId: adminUser.id,
              authorizerUserName: adminUser.name,
              items: voidItemRecords,
            })
          ) as Prisma.InputJsonValue,
        },
      })

      // 6.5 Update Order metadata and status
      const updatedVoids = [...existingVoids, newVoidRecord]
      const updatedMetadata = {
        ...orderMetadata,
        voids: updatedVoids,
      }

      const newOrderStatus = isFullVoid ? 'CANCELLED' : order.status

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          metadata: JSON.parse(JSON.stringify(updatedMetadata)) as Prisma.InputJsonValue,
          status: newOrderStatus,
          ...(isFullVoid
            ? {
                cancelledAt: new Date(),
                cancellationReason: `Anulación total por ${adminUser.name}: ${reason}`,
              }
            : {}),
        },
        include: {
          items: true,
        },
      })

      // Calculate remaining items
      const remainingItems = updatedOrder.items.map(
        (item: { id: string; name: string; quantity: number }) => {
          const returnedCount = updatedVoids.reduce((sum: number, v: OrderVoidRecord) => {
            const matched = v.items.find((vi: OrderVoidItemRecord) => vi.orderItemId === item.id)
            return sum + (matched?.quantityReturned || 0)
          }, 0)
          return {
            orderItemId: item.id,
            name: item.name,
            quantityRemaining: Math.max(0, item.quantity - returnedCount),
          }
        }
      )

      return {
        success: true,
        voidRecord: newVoidRecord,
        orderStatus: updatedOrder.status,
        remainingItems,
      }
    })

    return result
  }
}

export const orderVoidService = new OrderVoidService()
