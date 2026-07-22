/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  X,
  Key,
  Shield,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User, UserRole } from '@/types'

interface UserDashboardClientProps {
  locationId: string
  locations: { id: string; name: string }[]
}

export default function UserDashboardClient({
  locationId: initialLocationId,
  locations,
}: UserDashboardClientProps) {
  // State lists
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  // Modals & Active objects
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirmPassword, setFormConfirmPassword] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('ADMIN')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formAssignedLocationId, setFormAssignedLocationId] = useState('')

  // UX Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  // Operator Simulation (similar to Cash Dashboard for ease of manual testing)
  const [simulatedRole, setSimulatedRole] = useState<string>('ADMIN')

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const activeParam =
        statusFilter === 'active'
          ? '&isActive=true'
          : statusFilter === 'inactive'
            ? '&isActive=false'
            : ''
      const roleParam = roleFilter !== 'all' ? `&role=${roleFilter}` : ''
      const locParam = locationFilter !== 'all' ? `&filterLocationId=${locationFilter}` : ''
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''

      const res = await fetch(
        `/api/catalog/users?locationId=${initialLocationId}${activeParam}${roleParam}${locParam}${searchParam}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cargar usuarios')
      setUsers(json.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter, statusFilter, locationFilter, initialLocationId])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  // Trigger search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setIsActionLoading(true)

    try {
      if (!formName.trim()) throw new Error('El nombre es obligatorio')
      if (!formUsername.trim()) throw new Error('El nombre de usuario es obligatorio')
      if (!formPassword || formPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres')
      }
      if (formPassword !== formConfirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      const res = await fetch(`/api/catalog/users?locationId=${initialLocationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          username: formUsername,
          email: formEmail || null,
          password: formPassword,
          role: formRole,
          isActive: formIsActive,
          assignedLocationId: formAssignedLocationId || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear usuario')

      showSuccess(`Usuario "${formUsername}" creado con éxito`)
      setIsCreateModalOpen(false)
      fetchUsers()
      // reset form
      setFormName('')
      setFormUsername('')
      setFormEmail('')
      setFormPassword('')
      setFormConfirmPassword('')
      setFormRole('ADMIN')
      setFormIsActive(true)
      setFormAssignedLocationId('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Edit Modal
  const openEdit = (user: User) => {
    setSelectedUser(user)
    setFormName(user.name)
    setFormEmail(user.email || '')
    setFormRole(user.role)
    setFormIsActive(user.isActive)
    setFormAssignedLocationId(user.locationId || '')
    setModalError(null)
    setIsEditModalOpen(true)
  }

  // Update User Submit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setModalError(null)
    setIsActionLoading(true)

    try {
      if (!formName.trim()) throw new Error('El nombre es obligatorio')

      const res = await fetch(`/api/catalog/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail || null,
          role: formRole,
          isActive: formIsActive,
          assignedLocationId: formAssignedLocationId || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar usuario')

      showSuccess(`Usuario "${selectedUser.username}" actualizado con éxito`)
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Password Modal
  const openPassword = (user: User) => {
    setSelectedUser(user)
    setFormPassword('')
    setFormConfirmPassword('')
    setModalError(null)
    setIsPasswordModalOpen(true)
  }

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setModalError(null)
    setIsActionLoading(true)

    try {
      if (!formPassword || formPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres')
      }
      if (formPassword !== formConfirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      const res = await fetch(`/api/catalog/users/${selectedUser.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formPassword }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cambiar contraseña')

      showSuccess(`Contraseña de "${selectedUser.username}" modificada con éxito`)
      setIsPasswordModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar contraseña'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Toggle Active State in list
  const handleToggleActive = async (user: User) => {
    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/catalog/users/${user.id}/toggle`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al alternar estado')

      showSuccess(`Estado del usuario "${user.username}" modificado con éxito`)
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al alternar estado'
      setErrorMessage(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Open Delete Confirm Modal
  const openDelete = (user: User) => {
    setSelectedUser(user)
    setModalError(null)
    setIsDeleteModalOpen(true)
  }

  // Delete User Submit
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setModalError(null)
    setIsActionLoading(true)

    try {
      const res = await fetch(`/api/catalog/users/${selectedUser.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar usuario')

      showSuccess(`Usuario "${selectedUser.username}" eliminado con éxito`)
      setIsDeleteModalOpen(false)
      fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar usuario'
      setModalError(message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const formatDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Security Simulation Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
          <Key className="h-4 w-4" />
          <span>SIMULACIÓN DE SEGURIDAD (VISTA PREVIA):</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-blue-700">Simular Rol Activo:</span>
          <select
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            className="rounded-lg border border-blue-200 bg-white p-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ADMIN">ADMIN (Permiso Completo)</option>
            <option value="CASHIER">CASHIER (Lectura / Sin acciones)</option>
          </select>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3">
        <a
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Dashboard
        </a>
        <a
          href="/dashboard/menu"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Cambios Rápidos Menú
        </a>
        <a
          href="/dashboard/catalog"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Catálogo Maestro
        </a>
        <a
          href="/dashboard/kitchen"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Cocina
        </a>
        <a
          href="/dashboard/pos"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          POS
        </a>
        <a
          href="/dashboard/cash"
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          Caja
        </a>
        <a
          href="/dashboard/users"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
        >
          Usuarios
        </a>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Administración de Usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea, edita, habilita y gestiona las credenciales del personal interno de tu
            restaurante.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {simulatedRole === 'ADMIN' && (
            <Button
              onClick={() => {
                setModalError(null)
                setIsCreateModalOpen(true)
              }}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nuevo Usuario
            </Button>
          )}
          <Button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            variant="outline"
            className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* UX Feedbacks */}
      {successMessage && (
        <div className="animate-in fade-in slide-in-from-top mb-6 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Filters & Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Filters Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Rol: Todos los roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="CASHIER">CASHIER</option>
              <option value="KITCHEN">KITCHEN</option>
              <option value="CAJERO">CAJERO</option>
              <option value="COCINA">COCINA</option>
              <option value="OPERADOR">OPERADOR</option>
              <option value="LECTURA">LECTURA</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Estado: Activos e Inactivos</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Sucursal: Todas las sucursales</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-slate-400">
              <p className="text-sm">No se encontraron usuarios matching los criterios.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs text-slate-500">
              <thead>
                <tr className="text-slate-650 border-b border-slate-200 bg-slate-50/70 font-semibold">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Sucursal</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Último Acceso</th>
                  <th className="px-6 py-4">Fecha Creación</th>
                  {simulatedRole === 'ADMIN' && <th className="px-6 py-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 font-mono">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.locationId ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {locations.find((l) => l.id === user.locationId)?.name ||
                            'Sucursal asignada'}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-400">Global (Acceso Completo)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={simulatedRole !== 'ADMIN' || isActionLoading}
                        onClick={() => handleToggleActive(user)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          user.isActive
                            ? 'border border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border border-rose-100 bg-rose-50 text-rose-800 hover:bg-rose-100'
                        } disabled:opacity-80`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3" /> Activo
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400">
                      {formatDateTime(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-400">
                      {formatDateTime(user.createdAt)}
                    </td>
                    {simulatedRole === 'ADMIN' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => openEdit(user)}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="Editar usuario"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => openPassword(user)}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="Cambiar contraseña"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            disabled={user.username === 'admin'} // Protect primary admin from deletion
                            onClick={() => openDelete(user)}
                            variant="outline"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white p-0 text-slate-500 hover:bg-slate-50 hover:text-rose-600 disabled:opacity-50"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Crear Nuevo Usuario</h3>
            <p className="mt-1 text-xs text-slate-500">
              Registra un nuevo miembro del personal en el restaurante.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Ej: jperez"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ej: juan@satem.cl"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    placeholder="Confirmar contraseña"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rol</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="KITCHEN">KITCHEN</option>
                    <option value="CAJERO">CAJERO</option>
                    <option value="COCINA">COCINA</option>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="LECTURA">LECTURA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Asignar Sucursal
                  </label>
                  <select
                    value={formAssignedLocationId}
                    onChange={(e) => setFormAssignedLocationId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Global (Sin restricción)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create-isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <label
                  htmlFor="create-isActive"
                  className="text-xs font-semibold text-slate-700 select-none"
                >
                  El usuario está activo e iniciar sesión está permitido
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
                >
                  {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Crear Usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">
              Editar Usuario: {selectedUser.username}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Modifica los atributos operativos o de contacto del usuario.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="juan@satem.cl"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rol</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER</option>
                    <option value="KITCHEN">KITCHEN</option>
                    <option value="CAJERO">CAJERO</option>
                    <option value="COCINA">COCINA</option>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="LECTURA">LECTURA</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Asignar Sucursal
                  </label>
                  <select
                    value={formAssignedLocationId}
                    onChange={(e) => setFormAssignedLocationId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="">Global (Sin restricción)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
                >
                  {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && selectedUser && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Cambiar Contraseña</h3>
            <p className="mt-1 text-xs text-slate-500">
              Modifica la clave de acceso de <strong>{selectedUser.username}</strong> de forma
              directa.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm"
                >
                  {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cambiar Contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
          <div className="animate-in zoom-in-95 relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Usuario?</h3>
            <p className="mt-2 text-xs text-slate-500">
              Esta acción marcará el registro de{' '}
              <strong>
                {selectedUser.name} ({selectedUser.username})
              </strong>{' '}
              como eliminado. El usuario perderá el acceso al sistema inmediatamente.
            </p>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500"
              >
                Cancelar
              </Button>
              <Button
                disabled={isActionLoading}
                onClick={handleDeleteUser}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirmar Eliminación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
