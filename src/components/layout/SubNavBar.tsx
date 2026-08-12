'use client'

import React from 'react'
import { hasPermission, type Permission } from '@/lib/permissions'
import type { UserRole } from '@/types'

interface SubNavBarProps {
  activeTab:
    | 'dashboard'
    | 'menu'
    | 'catalog'
    | 'kitchen'
    | 'pos'
    | 'cash'
    | 'users'
    | 'discounts'
    | 'reports'
  currentUserRole: string
}

export function SubNavBar({ activeTab, currentUserRole }: SubNavBarProps) {
  const role = currentUserRole as UserRole

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      requiredPermission: null,
    },
    {
      id: 'reports',
      label: 'Reportes',
      href: '/dashboard/reports',
      requiredPermission: 'reports.view' as Permission,
    },
    {
      id: 'menu',
      label: 'Cambios Rápidos Menú',
      href: '/dashboard/menu',
      requiredPermission: 'catalog.manage' as Permission,
    },
    {
      id: 'catalog',
      label: 'Catálogo Maestro',
      href: '/dashboard/catalog',
      requiredPermission: 'catalog.manage' as Permission,
    },
    {
      id: 'kitchen',
      label: 'Cocina',
      href: '/dashboard/kitchen',
      requiredPermission: 'kitchen.view' as Permission,
    },
    {
      id: 'pos',
      label: 'POS',
      href: '/dashboard/pos',
      requiredPermission: 'pos.sell' as Permission,
    },
    {
      id: 'cash',
      label: 'Caja',
      href: '/dashboard/cash',
      requiredPermission: 'cash.view' as Permission,
    },
    {
      id: 'users',
      label: 'Usuarios',
      href: '/dashboard/users',
      requiredPermission: 'users.view' as Permission,
    },
    {
      id: 'discounts',
      label: 'Descuentos',
      href: '/dashboard/discounts',
      requiredPermission: 'discounts.view' as Permission,
    },
  ]

  const visibleTabs = tabs.filter(
    (tab) => !tab.requiredPermission || hasPermission(role, tab.requiredPermission)
  )

  return (
    <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-slate-200 pb-3">
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <a
            key={tab.id}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-slate-900 font-bold text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </a>
        )
      })}
    </div>
  )
}
