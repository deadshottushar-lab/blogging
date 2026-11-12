import { hashPassword } from './auth.js'

/**
 * Persistence layer.
 *
 * The whole platform runs client-side so it deploys as a single static bundle.
 * State lives in localStorage and is kept in sync across browser tabs via the
 * `storage` event.
 */

const STORAGE_KEY = 'lumen.state.v1'
const SESSION_KEY = 'lumen.session.v1'
const THEME_KEY = 'lumen.theme.v1'

/** Read a JSON value from localStorage, returning null on any failure. */
function readJSON(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full or disabled (private mode) — the app still works in memory.
  }
}

/** Hash any seed accounts that were stored with a plaintext demo password. */
async function hydrateSeedPasswords(state) {
  if (!state.seedPasswords || !Array.isArray(state.users)) return state
  let mutated = false
  const users = await Promise.all(
    state.users.map(async (user) => {
      if (user.passwordHash) return user
      const plain = state.seedPasswords[user.id]
      if (!plain) return user
      mutated = true
      const { _pendingPassword: _ignored, ...rest } = user
      return {
        ...rest,
        passwordHash: await hashPassword(plain, user.salt || user.id),
      }
    }),
  )
  if (!mutated) return state
  const { seedPasswords: _seedPasswords, ...next } = state
  next.users = users
  return next
}

/** Load persisted state, falling back to the demo seed on first run. */
export async function loadState(seedBuilder) {
  const stored = readJSON(STORAGE_KEY)
  if (stored && Array.isArray(stored.posts) && Array.isArray(stored.users)) {
    const hydrated = await hydrateSeedPasswords(stored)
    return hydrated
  }
  const seeded = seedBuilder()
  const hydrated = await hydrateSeedPasswords(seeded)
  writeJSON(STORAGE_KEY, hydrated)
  return hydrated
}

export function saveState(state) {
  const { seedPasswords: _seedPasswords, ...rest } = state
  writeJSON(STORAGE_KEY, rest)
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/* ----------------------------- session ----------------------------- */

export function readSession() {
  return readJSON(SESSION_KEY)
}

export function writeSession(userId) {
  writeJSON(SESSION_KEY, { userId, at: Date.now() })
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/* ------------------------------ theme ------------------------------ */

export function readTheme() {
  return readJSON(THEME_KEY) || 'light'
}

export function writeTheme(theme) {
  writeJSON(THEME_KEY, theme)
}

/* --------------------------- storage events ------------------------ */

/** Subscribe to state changes made by other tabs. */
export function onExternalChange(handler) {
  const listener = (event) => {
    if (event.key === STORAGE_KEY) handler()
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
