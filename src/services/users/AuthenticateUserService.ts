import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User } from '@/types'
import { ValidationError } from '@/lib/errors'
import { verifyPassword } from '@/lib/password-crypto'

export class AuthenticateUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  /**
   * Performs authentication of user credentials.
   * Matches username, verifies PBKDF2 passwordHash and updates lastLoginAt timestamp on success.
   *
   * @param username Plain username string input
   * @param password Plain password string input (passed as passwordHash in service parameters name)
   * @returns Verified User record
   */
  async execute(username: string, passwordInput: string): Promise<User> {
    const cleanUsername = (username || '').trim()
    if (!cleanUsername) {
      throw new ValidationError('El nombre de usuario es obligatorio.')
    }
    if (!passwordInput) {
      throw new ValidationError('La contraseña es obligatoria.')
    }

    const user = await this.userRepo.findByUsername(cleanUsername)
    if (!user) {
      throw new ValidationError('Usuario o contraseña incorrectos.')
    }

    if (!user.isActive) {
      throw new ValidationError(
        'Este usuario se encuentra deshabilitado. Contacte a un administrador.'
      )
    }

    const storedHash = await this.userRepo.getPasswordHash(user.id)
    if (!storedHash) {
      throw new ValidationError('Usuario o contraseña incorrectos.')
    }

    const isMatch = verifyPassword(passwordInput, storedHash)
    if (!isMatch) {
      throw new ValidationError('Usuario o contraseña incorrectos.')
    }

    // Update last login timestamp in PostgreSQL
    await this.userRepo.updateLastLogin(user.id, new Date())

    const updated = await this.userRepo.findById(user.id)
    if (!updated) {
      throw new ValidationError('Error al cargar perfil tras autenticación.')
    }

    return updated
  }
}
