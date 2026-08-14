import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { TenantResolver } from '@/server/tenant-resolver'
import LogoutButton from './LogoutButton'
import LocationSwitcher from './LocationSwitcher'
import { SatemLogo } from '@/components/ui/SatemLogo'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Enforce session check on the Server Component layout layer
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Get accessible locations for the logged-in user
  const accessibleLocations = await TenantResolver.getAccessibleLocations(session.userId)
  const activeLocation =
    accessibleLocations.find((l) => l.id === session.locationId) || accessibleLocations[0]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-black tracking-tight text-slate-900 select-none">
              <SatemLogo className="h-5 w-auto text-slate-900" />
              <span>Food Engine</span>
            </span>

            {/* Branch Badge or Switcher */}
            {accessibleLocations.length > 1 ? (
              <LocationSwitcher
                locations={accessibleLocations}
                currentLocationId={activeLocation?.id || ''}
              />
            ) : (
              activeLocation && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-700 select-none">
                  <span className="text-[10px]">📍</span>
                  <span>{activeLocation.name}</span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* User Session Metadata */}
            <div className="hidden text-right select-none sm:block">
              <div className="text-xs font-bold text-slate-800">{session.name}</div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {session.role}
              </div>
            </div>

            {/* Logout Trigger */}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Primary Dashboard Panel View */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
