import 'server-only'

import type { IUserRepository } from '@/repositories'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { hashPassword } from '@/lib/password-crypto'

export class ChangePasswordService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }

    if (newPassword.length < 8) {
      throw new ValidationError('La contraseña debe tener al menos 8 caracteres')
    }

    const hashed = hashPassword(newPassword)
    await this.userRepo.changePassword(id, hashed)
  }
}
