import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from './lib/session'

// Config matcher to specify which paths this middleware runs on.
// Excludes public paths like /menu or public api endpoints.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/catalog/:path*',
    '/api/discounts/:path*',
    '/api/kitchen/:path*',
    '/api/pos/:path*',
    '/api/inventory/:path*',
  ],
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  // Verify and parse HMAC signature of session token
  const session = token ? await decryptSession(token) : null

  if (!session) {
    // 1. If it's a private API route, reject immediately with 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Autenticación requerida.' }, { status: 401 })
    }

    // 2. If it's a dashboard page route, redirect to /login with callbackUrl search param
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Session is valid. Continue request propagation.
  return NextResponse.next()
}
