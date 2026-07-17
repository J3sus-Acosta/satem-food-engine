// Route Group: (dashboard)
// Contains protected admin routes: order management, inventory, settings, etc.
// Authentication middleware will be added here in a future phase.
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
