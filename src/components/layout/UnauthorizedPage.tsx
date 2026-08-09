import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { SubNavBar } from './SubNavBar'

interface UnauthorizedPageProps {
  activeTab: 'dashboard' | 'menu' | 'catalog' | 'kitchen' | 'pos' | 'cash' | 'users' | 'discounts'
  currentUserRole: string
}

export function UnauthorizedPage({ activeTab, currentUserRole }: UnauthorizedPageProps) {
  return (
    <div className="min-h-screen bg-slate-50/40 p-4 font-sans text-slate-800 select-none md:p-8">
      {/* Reusable Sub-navigation */}
      <SubNavBar activeTab={activeTab} currentUserRole={currentUserRole} />

      {/* Access Denied Card Box */}
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-lg font-bold text-slate-900">Acceso Restringido</h2>
        <p className="mt-2 text-sm text-slate-500">
          El rol <span className="font-extrabold text-red-600">&quot;{currentUserRole}&quot;</span>{' '}
          no tiene permiso en este módulo.
        </p>
        <div className="border-slate-150 mt-8 border-t pt-6">
          <a
            href="/dashboard"
            className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  )
}
