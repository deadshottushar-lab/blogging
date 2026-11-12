/**
 * Authentication primitives.
 *
 * Passwords are salted and hashed with SHA-256 via the Web Crypto API when a
 * secure context is available, with a deterministic fallback hash otherwise so
 * the app still works when opened over plain HTTP or from disk.
 */

const SALT_PREFIX = 'lumen::'

async function subtleHash(password, salt) {
  const data = new TextEncoder().encode(`${salt}${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function fallbackHash(password, salt) {
  // FNV-1a style mix — not cryptographic, only used when Web Crypto is absent.
  const input = `${salt}${password}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
    h2 = ((h2 << 13) | (h2 >>> 19)) >>> 0
  }
  return `${h1.toString(16)}${h2.toString(16)}${input.length.toString(16)}`
}

/** Hash a password with a per-user salt. */
export async function hashPassword(password, salt) {
  const fullSalt = `${SALT_PREFIX}${salt}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      return `sha256:${await subtleHash(password, fullSalt)}`
    } catch {
      // fall through to the non-crypto implementation
    }
  }
  return `fnv:${fallbackHash(password, fullSalt)}`
}

/** Constant-time-ish comparison of two stored hashes. */
export function verifyPassword(password, salt, stored) {
  if (!stored) return false
  const expected = stored
  return hashPassword(password, salt).then((actual) => {
    if (actual.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < actual.length; i += 1) {
      diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return diff === 0
  })
}

/** Basic client-side validation for the auth forms. */
export function validateRegister({ name, username, email, password, confirm }) {
  const errors = {}
  if (!name || name.trim().length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).'
  }
  if (!username || !/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
    errors.username = 'Username must be 3–20 letters, numbers or underscores.'
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  } else if (confirm !== undefined && password !== confirm) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}
