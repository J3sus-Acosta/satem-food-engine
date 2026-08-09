import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'

// POST /api/auth/logout
export async function POST(): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    await clearSessionCookie()
    return NextResponse.json({ data: { success: true } })
  } catch (error: unknown) {
    console.error('[POST /api/auth/logout] Error clearing session:', error)
    return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 })
  }
}
