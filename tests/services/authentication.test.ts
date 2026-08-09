import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthenticateUserService } from '@/services/users/AuthenticateUserService'
import type { IUserRepository } from '@/repositories'
import { ValidationError } from '@/lib/errors'
import { hashPassword } from '@/lib/password-crypto'

type MockUserRepo = {
  [K in keyof IUserRepository]: ReturnType<typeof vi.fn>
}

describe('Authentication Domain Service', () => {
  let mockRepo: MockUserRepo
  let service: AuthenticateUserService

  const testUser = {
    id: 'user123',
    organizationId: 'org123',
    locationId: 'loc123',
    name: 'Juan Perez',
    username: 'juanito',
    email: 'juan@satem.cl',
    role: 'CASHIER' as const,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  // Create hash for testing (password is 'Password@123')
  const validHash = hashPassword('Password@123')

  beforeEach(() => {
    mockRepo = {
      create: vi.fn(),
      update: vi.fn(),
      changePassword: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
      getPasswordHash: vi.fn(),
      updateLastLogin: vi.fn(),
    } as unknown as MockUserRepo

    service = new AuthenticateUserService(mockRepo as unknown as IUserRepository)
  })

  it('should authenticate successfully with correct credentials and update lastLoginAt', async () => {
    mockRepo.findByUsername.mockResolvedValue(testUser)
    mockRepo.getPasswordHash.mockResolvedValue(validHash)
    // After updateLastLogin succeeds, it fetches updated user details
    mockRepo.findById.mockResolvedValue({ ...testUser, lastLoginAt: new Date() })

    const result = await service.execute('juanito', 'Password@123')

    expect(result).toBeDefined()
    expect(result.username).toBe('juanito')
    expect(mockRepo.findByUsername).toHaveBeenCalledWith('juanito')
    expect(mockRepo.getPasswordHash).toHaveBeenCalledWith('user123')
    expect(mockRepo.updateLastLogin).toHaveBeenCalledWith('user123', expect.any(Date))
  })

  it('should throw ValidationError if username is missing', async () => {
    await expect(service.execute('', 'Password@123')).rejects.toThrow(
      new ValidationError('El nombre de usuario es obligatorio.')
    )
  })

  it('should throw ValidationError if password is missing', async () => {
    await expect(service.execute('juanito', '')).rejects.toThrow(
      new ValidationError('La contraseña es obligatoria.')
    )
  })

  it('should throw ValidationError if user is not found', async () => {
    mockRepo.findByUsername.mockResolvedValue(null)

    await expect(service.execute('nonexistent', 'Password@123')).rejects.toThrow(
      new ValidationError('Usuario o contraseña incorrectos.')
    )
  })

  it('should throw ValidationError if user is inactive', async () => {
    mockRepo.findByUsername.mockResolvedValue({ ...testUser, isActive: false })

    await expect(service.execute('juanito', 'Password@123')).rejects.toThrow(
      new ValidationError('Este usuario se encuentra deshabilitado. Contacte a un administrador.')
    )
  })

  it('should throw ValidationError if password hash is not stored', async () => {
    mockRepo.findByUsername.mockResolvedValue(testUser)
    mockRepo.getPasswordHash.mockResolvedValue(null)

    await expect(service.execute('juanito', 'Password@123')).rejects.toThrow(
      new ValidationError('Usuario o contraseña incorrectos.')
    )
  })

  it('should throw ValidationError if password does not match', async () => {
    mockRepo.findByUsername.mockResolvedValue(testUser)
    mockRepo.getPasswordHash.mockResolvedValue(validHash)

    await expect(service.execute('juanito', 'WrongPassword')).rejects.toThrow(
      new ValidationError('Usuario o contraseña incorrectos.')
    )
  })
})
