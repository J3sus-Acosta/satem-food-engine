import React from 'react'
import {
  BookOpen,
  ChefHat,
  MonitorPlay,
  ClipboardList,
  Calculator,
  LayoutDashboard,
  TrendingUp,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'Panel de Administración',
  description: 'SATEM Food Engine - Hub de Control Administrativo y Operativo',
}

export default function DashboardHubPage() {
  const modules = [
    {
      title: 'Cambios Rápidos Menú',
      description: 'Control de disponibilidad diaria, precios del día y stock operacional rápido.',
      href: '/dashboard/menu',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-400',
      badge: 'Operacional',
    },
    {
      title: 'Catálogo Maestro',
      description:
        'Definición estructural de productos, recetas, ingredientes y modificadores globales.',
      href: '/dashboard/catalog',
      icon: ClipboardList,
      color: 'from-blue-500 to-indigo-400',
      badge: 'Estructural',
    },
    {
      title: 'Pantalla de Cocina',
      description:
        'Monitoreo de pedidos en tiempo real, control de tiempos de preparación y cola FIFO.',
      href: '/dashboard/kitchen',
      icon: ChefHat,
      color: 'from-amber-500 to-orange-400',
      badge: 'Cocina',
    },
    {
      title: 'Caja / Cierre de Caja',
      description:
        'Aperturas de turnos, arqueos de efectivo, control de retiros y conciliación de métodos de pago.',
      href: '/dashboard/cash',
      icon: Calculator,
      color: 'from-rose-500 to-pink-400',
      badge: 'Financiero',
    },
    {
      title: 'Punto de Venta (POS)',
      description: 'Toma rápida de pedidos presenciales para el cajero de la sucursal.',
      href: '/dashboard/pos',
      icon: MonitorPlay,
      color: 'from-violet-500 to-purple-400',
      badge: 'Ventas',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administración de accesos, roles, estados y contraseñas del personal interno.',
      href: '/dashboard/users',
      icon: Users,
      color: 'from-cyan-500 to-sky-400',
      badge: 'Seguridad',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 px-6 py-12 font-sans text-slate-800 md:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 border-b border-slate-200 pb-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <div className="text-slate-650 mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold">
              <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
              <span>HUB DE ADMINISTRACIÓN</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              SATEM Food Engine
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Bienvenido al panel central. Selecciona el módulo operativo o administrativo que
              deseas gestionar.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:text-left">
              <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Estado del Sistema
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-800 sm:justify-start">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span>En Línea (Producción)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, idx) => {
            const Icon = mod.icon
            return (
              <a
                key={idx}
                href={mod.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 select-none hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color} text-white shadow-md shadow-slate-100`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-slate-550 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {mod.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-900 transition-colors group-hover:text-slate-800">
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{mod.description}</p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-slate-400 transition-colors group-hover:text-slate-800">
                  <span>Ingresar al módulo</span>
                  <span className="ml-1.5 transform transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
