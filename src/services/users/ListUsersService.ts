import 'server-only'

import type { IUserRepository } from '@/repositories'
import type { User, UserRole } from '@/types'

export class ListUsersService {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    organizationId: string,
    filters?: {
      search?: string
      role?: UserRole
      isActive?: boolean
      locationId?: string
    }
  ): Promise<User[]> {
    return this.userRepo.list(organizationId, filters)
  }
}
