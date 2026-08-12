import React from 'react'
import { requireAuth } from '@/lib/auth-server'
import { requirePermission } from '@/lib/permissions'
import { db } from '@/server/db'
import { ReportsDashboardClient } from './ReportsDashboardClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await requireAuth()
  requirePermission(session, 'reports.view')

  // Fetch list of cashiers/operators in current organization for filter selector
  const cashiers = await db.user.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <ReportsDashboardClient userRole={session.role} userId={session.userId} cashiers={cashiers} />
  )
}
