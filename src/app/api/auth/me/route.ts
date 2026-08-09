import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'

// GET /api/auth/me
export async function GET(): Promise<
  NextResponse<
    ApiResponse<{
      userId: string
      organizationId: string
      locationId: string | null
      role: string
      username: string
      name: string
    }>
  >
> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
    }

    return NextResponse.json({
      data: {
        userId: session.userId,
        organizationId: session.organizationId,
        locationId: session.locationId,
        role: session.role,
        username: session.username,
        name: session.name,
      },
    })
  } catch (error: unknown) {
    console.error('[GET /api/auth/me] Error resolving session:', error)
    return NextResponse.json({ error: 'Error al obtener sesión activa.' }, { status: 500 })
  }
}
