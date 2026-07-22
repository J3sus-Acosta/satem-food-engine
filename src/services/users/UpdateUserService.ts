import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User, UserRole } from '@/types'
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors'

export class UpdateUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    id: string,
    data: {
      locationId?: string | null
      name?: string
      email?: string | null
      role?: UserRole
      isActive?: boolean
    }
  ): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }

    if (data.email) {
      const emailNormalized = data.email.trim().toLowerCase()
      if (!emailNormalized.includes('@')) {
        throw new ValidationError('El formato del correo electrónico es inválido')
      }

      const existingEmail = await this.userRepo.findByEmail(emailNormalized)
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError('El correo electrónico ya está registrado por otro usuario')
      }
    }

    return this.userRepo.update(id, {
      locationId: data.locationId,
      name: data.name ? data.name.trim() : undefined,
      email: data.email === null ? null : data.email ? data.email.trim().toLowerCase() : undefined,
      role: data.role,
      isActive: data.isActive,
    })
  }
}
