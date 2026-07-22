import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User, UserRole } from '@/types'
import { ValidationError, ConflictError } from '@/lib/errors'
import { hashPassword } from '@/lib/password-crypto'

export class CreateUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: {
    organizationId: string
    locationId?: string | null
    name: string
    username: string
    email?: string | null
    passwordHash: string // plaintext password here from DTO, will hash it
    role: UserRole
    isActive?: boolean
  }): Promise<User> {
    const username = data.username.trim().toLowerCase()
    if (!username) {
      throw new ValidationError('El nombre de usuario es obligatorio')
    }

    if (data.passwordHash.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres')
    }

    // Check unique username
    const existingUsername = await this.userRepo.findByUsername(username)
    if (existingUsername) {
      throw new ConflictError('El nombre de usuario ya está registrado')
    }

    // Check unique email if provided
    if (data.email) {
      const emailNormalized = data.email.trim().toLowerCase()
      if (!emailNormalized.includes('@')) {
        throw new ValidationError('El formato del correo electrónico es inválido')
      }
      const existingEmail = await this.userRepo.findByEmail(emailNormalized)
      if (existingEmail) {
        throw new ConflictError('El correo electrónico ya está registrado')
      }
    }

    const hashed = hashPassword(data.passwordHash)

    return this.userRepo.create({
      organizationId: data.organizationId,
      locationId: data.locationId,
      name: data.name.trim(),
      username,
      email: data.email ? data.email.trim().toLowerCase() : null,
      passwordHash: hashed,
      role: data.role,
      isActive: data.isActive,
    })
  }
}
