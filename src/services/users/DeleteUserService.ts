import 'server-only'

import type { IUserRepository } from '@/repositories'
import { NotFoundError } from '@/lib/errors'

export class DeleteUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }

    await this.userRepo.delete(id)
  }
}
