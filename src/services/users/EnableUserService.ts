import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User } from '@/types'
import { NotFoundError } from '@/lib/errors'

export class EnableUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundError('User', id)
    }

    return this.userRepo.update(id, { isActive: true })
  }
}
