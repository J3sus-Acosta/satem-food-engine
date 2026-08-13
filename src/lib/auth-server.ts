import { cookies } from 'next/headers'
import { decryptSession, encryptSession, type SessionPayload } from './session'

const COOKIE_NAME = 'session'

/**
 * Retrieves the current authenticated user session from secure cookies.
 * Asynchronous to support Next.js 16 async headers/cookies.
 *
 * @returns Session payload if valid, otherwise null
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await decryptSession(token)
  } catch {
    return null
  }
}

/**
 * Asserts that a user session is active. Throws an error if not authenticated.
 *
 * @returns Active session payload
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('Autenticación requerida')
  }
  return session
}

/**
 * Encrypts and writes the session token to a secure HttpOnly cookie (24h duration).
 *
 * @param payload Basic user details to save in token
 */
export async function setSessionCookie(payload: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const durationMs = 24 * 60 * 60 * 1000
  const token = await encryptSession(payload, durationMs)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(durationMs / 1000),
  })
}

/**
 * Clears/deletes the session cookie to perform logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
