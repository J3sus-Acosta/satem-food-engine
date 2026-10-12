'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface PrintAwareDashboardShellProps {
  header: React.ReactNode
  children: React.ReactNode
}

/**
 * Omits the app chrome on dedicated print routes so window.print()
 * cannot include the dashboard header.
 */
export default function PrintAwareDashboardShell({
  header,
  children,
}: PrintAwareDashboardShellProps) {
  const pathname = usePathname()
  const isPrintRoute = pathname.includes('/print')

  if (isPrintRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {header}
      <main className="flex-1">{children}</main>
    </div>
  )
}
