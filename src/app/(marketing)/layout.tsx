// Route Group: (marketing)
// Contains public-facing routes: landing page, digital menu, etc.
// This layout is intentionally minimal — shared shell goes in the root layout.
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
