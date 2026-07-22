import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CreateUserService,
  UpdateUserService,
  ChangePasswordService,
  EnableUserService,
  DisableUserService,
  DeleteUserService,
  FindUserService,
  ListUsersService,
} from '@/services/users'
import type { IUserRepository } from '@/repositories'
import { ValidationError, ConflictError, NotFoundError } from '@/lib/errors'
import { verifyPassword } from '@/lib/password-crypto'

type MockUserRepo = {
  [K in keyof IUserRepository]: ReturnType<typeof vi.fn>
}

describe('User Management Service Domain Flow', () => {
  let mockUserRepo: MockUserRepo
  let createUserService: CreateUserService
  let updateUserService: UpdateUserService
  let changePasswordService: ChangePasswordService
  let enableUserService: EnableUserService
  let disableUserService: DisableUserService
  let deleteUserService: DeleteUserService
  let findUserService: FindUserService
  let listUsersService: ListUsersService

  const demoUser = {
    id: 'usr123',
    organizationId: 'org123',
    locationId: 'loc123',
    name: 'Juan Pérez',
    username: 'jperez',
    email: 'juan@satem.cl',
    avatarUrl: null,
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  beforeEach(() => {
    mockUserRepo = {
      create: vi.fn(),
      update: vi.fn(),
      changePassword: vi.fn(),
      findById: vi.fn(),
      findByUsername: vi.fn(),
      findByEmail: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
      getPasswordHash: vi.fn(),
    } as unknown as MockUserRepo

    createUserService = new CreateUserService(mockUserRepo as unknown as IUserRepository)
    updateUserService = new UpdateUserService(mockUserRepo as unknown as IUserRepository)
    changePasswordService = new ChangePasswordService(mockUserRepo as unknown as IUserRepository)
    enableUserService = new EnableUserService(mockUserRepo as unknown as IUserRepository)
    disableUserService = new DisableUserService(mockUserRepo as unknown as IUserRepository)
    deleteUserService = new DeleteUserService(mockUserRepo as unknown as IUserRepository)
    findUserService = new FindUserService(mockUserRepo as unknown as IUserRepository)
    listUsersService = new ListUsersService(mockUserRepo as unknown as IUserRepository)
  })

  describe('CreateUserService', () => {
    it('debe lanzar ValidationError si el nombre de usuario es vacío', async () => {
      await expect(
        createUserService.execute({
          organizationId: 'org123',
          name: 'Usuario Nuevo',
          username: '',
          passwordHash: 'Admin@123',
          role: 'CASHIER',
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ValidationError si la clave es menor a 8 caracteres', async () => {
      await expect(
        createUserService.execute({
          organizationId: 'org123',
          name: 'Usuario Nuevo',
          username: 'usernuevo',
          passwordHash: 'short',
          role: 'CASHIER',
        })
      ).rejects.toThrow(ValidationError)
    })

    it('debe lanzar ConflictError si el nombre de usuario ya existe', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(demoUser)

      await expect(
        createUserService.execute({
          organizationId: 'org123',
          name: 'Juan Pérez',
          username: 'jperez',
          passwordHash: 'Admin@123',
          role: 'CASHIER',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('debe lanzar ConflictError si el correo ya existe por otro usuario', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockUserRepo.findByEmail.mockResolvedValue(demoUser)

      await expect(
        createUserService.execute({
          organizationId: 'org123',
          name: 'Juan Pérez',
          username: 'jperez-new',
          email: 'juan@satem.cl',
          passwordHash: 'Admin@123',
          role: 'CASHIER',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('debe crear el usuario y hashear su contraseña si los datos son válidos', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.create.mockImplementation((data) => {
        return Promise.resolve({
          id: 'new_id',
          ...data,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })
      })

      const result = await createUserService.execute({
        organizationId: 'org123',
        name: 'Usuario Nuevo',
        username: 'usernuevo',
        passwordHash: 'Admin@123',
        role: 'CASHIER',
      })

      expect(result.username).toBe('usernuevo')
      expect(mockUserRepo.create).toHaveBeenCalledOnce()

      const createdArgs = mockUserRepo.create.mock.calls[0][0]
      expect(createdArgs.passwordHash).not.toBe('Admin@123')
      expect(verifyPassword('Admin@123', createdArgs.passwordHash)).toBe(true)
    })
  })

  describe('UpdateUserService', () => {
    it('debe lanzar NotFoundError si el usuario no existe', async () => {
      mockUserRepo.findById.mockResolvedValue(null)

      await expect(updateUserService.execute('nonexistent', { name: 'New Name' })).rejects.toThrow(
        NotFoundError
      )
    })

    it('debe actualizar los datos básicos del usuario', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)
      mockUserRepo.update.mockResolvedValue({ ...demoUser, name: 'Juan Pérez Editado' })

      const result = await updateUserService.execute('usr123', {
        name: 'Juan Pérez Editado',
      })

      expect(result.name).toBe('Juan Pérez Editado')
      expect(mockUserRepo.update).toHaveBeenCalledWith('usr123', {
        name: 'Juan Pérez Editado',
        email: undefined,
        role: undefined,
        isActive: undefined,
        locationId: undefined,
      })
    })
  })

  describe('ChangePasswordService', () => {
    it('debe lanzar ValidationError si la clave es menor a 8 caracteres', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)

      await expect(changePasswordService.execute('usr123', 'short')).rejects.toThrow(
        ValidationError
      )
    })

    it('debe cambiar la contraseña hasheándola con éxito', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)
      mockUserRepo.changePassword.mockResolvedValue(undefined)

      await changePasswordService.execute('usr123', 'NewSecr@tPassword!')

      expect(mockUserRepo.changePassword).toHaveBeenCalledOnce()
      const passedHash = mockUserRepo.changePassword.mock.calls[0][1]
      expect(passedHash).not.toBe('NewSecr@tPassword!')
      expect(verifyPassword('NewSecr@tPassword!', passedHash)).toBe(true)
    })
  })

  describe('EnableUserService & DisableUserService', () => {
    it('debe habilitar un usuario inactivo', async () => {
      mockUserRepo.findById.mockResolvedValue({ ...demoUser, isActive: false })
      mockUserRepo.update.mockResolvedValue({ ...demoUser, isActive: true })

      const result = await enableUserService.execute('usr123')
      expect(result.isActive).toBe(true)
      expect(mockUserRepo.update).toHaveBeenCalledWith('usr123', { isActive: true })
    })

    it('debe deshabilitar un usuario activo', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)
      mockUserRepo.update.mockResolvedValue({ ...demoUser, isActive: false })

      const result = await disableUserService.execute('usr123')
      expect(result.isActive).toBe(false)
      expect(mockUserRepo.update).toHaveBeenCalledWith('usr123', { isActive: false })
    })
  })

  describe('DeleteUserService', () => {
    it('debe llamar soft delete en repositorio', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)
      mockUserRepo.delete.mockResolvedValue(undefined)

      await deleteUserService.execute('usr123')
      expect(mockUserRepo.delete).toHaveBeenCalledWith('usr123')
    })
  })

  describe('FindUserService', () => {
    it('debe retornar el usuario si existe', async () => {
      mockUserRepo.findById.mockResolvedValue(demoUser)

      const result = await findUserService.execute('usr123')
      expect(result).toEqual(demoUser)
      expect(mockUserRepo.findById).toHaveBeenCalledWith('usr123')
    })
  })

  describe('ListUsersService', () => {
    it('debe retornar lista de usuarios filtrada', async () => {
      mockUserRepo.list.mockResolvedValue([demoUser])

      const result = await listUsersService.execute('org123', { role: 'ADMIN' })
      expect(result).toEqual([demoUser])
      expect(mockUserRepo.list).toHaveBeenCalledWith('org123', { role: 'ADMIN' })
    })
  })
})
