export interface SessionPayload {
  userId: string
  organizationId: string
  locationId: string | null
  role: string
  username: string
  name: string
  expiresAt: number
}

// Session secret key with development fallback
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'fallback-secret-key-satem-food-engine-rc1-fase-14-auth-real-2026'

/**
 * Encodes a string to base64url format.
 * Pure JS to avoid Buffer issues in Edge Runtime environments.
 */
function base64urlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decodes a base64url encoded string.
 */
function base64urlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return decodeURIComponent(escape(atob(base64)))
}

/**
 * Helper to compute an HMAC-SHA256 signature using global Web Crypto API.
 * Fully compatible with Node.js 16+ and Next.js Edge Runtime.
 */
async function signHmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyBuf = encoder.encode(secret)
  const dataBuf = encoder.encode(data)

  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, dataBuf)
  const bytes = new Uint8Array(signature)

  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Encrypts (signs) session details into a secure signed token.
 * Uses HMAC-SHA256 signature to guarantee tampering prevention.
 * Asynchronous to leverage global Web Crypto APIs natively.
 *
 * @param payload Session data to store
 * @param durationMs Duration of the session in milliseconds (defaults to 24h)
 * @returns Signed token string
 */
export async function encryptSession(
  payload: Omit<SessionPayload, 'expiresAt'>,
  durationMs = 24 * 60 * 60 * 1000
): Promise<string> {
  const expiresAt = Date.now() + durationMs
  const fullPayload: SessionPayload = { ...payload, expiresAt }

  const serialized = JSON.stringify(fullPayload)
  const payloadBase64 = base64urlEncode(serialized)

  const signature = await signHmacSha256(payloadBase64, SESSION_SECRET)

  return `${payloadBase64}.${signature}`
}

/**
 * Verifies and decodes a signed session token.
 *
 * @param token Signed token string from cookie
 * @returns Decoded session payload, or null if invalid/expired/tampered
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadBase64, signature] = parts

    const expectedSignature = await signHmacSha256(payloadBase64, SESSION_SECRET)

    if (signature !== expectedSignature) {
      return null // Tampered token
    }

    const serialized = base64urlDecode(payloadBase64)
    const payload = JSON.parse(serialized) as SessionPayload

    if (payload.expiresAt < Date.now()) {
      return null // Session expired
    }

    return payload
  } catch {
    return null // Deserialization / decode failure
  }
}
