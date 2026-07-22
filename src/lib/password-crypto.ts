import crypto from 'crypto'

/**
 * Generates a secure hash using PBKDF2 with SHA-512 and a random salt.
 * Output format is `salt:hash` in hexadecimal.
 *
 * @param password Plaintext password to hash
 * @returns Securely hashed string
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifies a plaintext password against a stored `salt:hash` string.
 * Uses timingSafeEqual to protect against timing attacks.
 *
 * @param password Plaintext password to verify
 * @param storedHash Hashed password to verify against
 * @returns true if password matches, false otherwise
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':')
    if (parts.length !== 2) return false

    const [salt, hash] = parts
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

    const buf1 = Buffer.from(hash, 'hex')
    const buf2 = Buffer.from(verifyHash, 'hex')

    if (buf1.length !== buf2.length) return false
    return crypto.timingSafeEqual(buf1, buf2)
  } catch {
    return false
  }
}
