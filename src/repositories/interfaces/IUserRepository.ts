import type { User, UserRole } from '@/types'

export interface IUserRepository {
  /**
   * Crea un nuevo usuario en la base de datos.
   */
  create(data: {
    organizationId: string
    locationId?: string | null
    name: string
    username: string
    email?: string | null
    passwordHash: string
    role: UserRole
    isActive?: boolean
  }): Promise<User>

  /**
   * Actualiza la información básica de un usuario.
   */
  update(
    id: string,
    data: {
      locationId?: string | null
      name?: string
      email?: string | null
      role?: UserRole
      isActive?: boolean
    }
  ): Promise<User>

  /**
   * Modifica la contraseña hasheada del usuario.
   */
  changePassword(id: string, passwordHash: string): Promise<void>

  /**
   * Busca un usuario activo por su ID técnico.
   */
  findById(id: string): Promise<User | null>

  /**
   * Busca un usuario activo por su nombre de usuario.
   */
  findByUsername(username: string): Promise<User | null>

  /**
   * Busca un usuario activo por su correo electrónico.
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Lista los usuarios de una organización aplicando filtros de búsqueda y estado.
   */
  list(
    organizationId: string,
    filters?: {
      search?: string
      role?: UserRole
      isActive?: boolean
      locationId?: string
    }
  ): Promise<User[]>

  /**
   * Realiza el borrado lógico (soft delete) de un usuario.
   */
  delete(id: string): Promise<void>

  /**
   * Obtiene la contraseña hasheada del usuario (requerido para autenticación).
   * No expuesto en la entidad User pública.
   */
  getPasswordHash(id: string): Promise<string | null>
}
