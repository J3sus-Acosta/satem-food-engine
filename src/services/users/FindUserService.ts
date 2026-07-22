import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User } from '@/types'

export class FindUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<User | null> {
    return this.userRepo.findById(id)
  }
}
