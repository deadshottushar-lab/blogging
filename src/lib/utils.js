// Small shared helpers used across the app.

let counter = 0

/** Generate a unique, URL-safe id. */
export function uid(prefix = 'id') {
  counter += 1
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`
}

/** Turn a title into a URL slug (falls back to a random id fragment). */
export function slugify(text) {
  const slug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
  return slug || `post-${Math.random().toString(36).slice(2, 8)}`
}

/** Human readable date, e.g. "Oct 24, 2026". */
export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Compact relative time, e.g. "3h ago". */
export function timeAgo(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000))
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['w', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ]
  for (const [label, size] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`
  }
  return 'just now'
}

/** Reading time estimate based on word count. */
export function readingTime(content) {
  const words = String(content || '')
    .split(/\s+/)
    .filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

/** First letter used for avatar placeholders. */
export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Derive a short excerpt from post content. */
export function makeExcerpt(content, limit = 180) {
  const plain = String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= limit) return plain
  return `${plain.slice(0, limit).trimEnd()}…`
}

/** Pick a stable greyscale shade from a seed string (monochrome avatars). */
const AVATAR_COLORS = [
  '#1c1c1c', '#3d3d3d', '#5e5e5e', '#7d7d7d',
  '#2a2a2a', '#4a4a4a', '#6b6b6b', '#8a8a8a',
]

export function colorFor(seed) {
  let hash = 0
  const text = String(seed || '')
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** Escape text for safe inclusion in markup builders. */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Validate a cover-image URL.
 * Returns '' when valid, or a message explaining the problem.
 * Only http(s) URLs are accepted — data:, javascript: and friends are rejected.
 */
export function validateImageUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return '' // optional field
  if (value.length > 2048) return 'That URL is too long (max 2048 characters).'
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return 'Enter a full image URL, e.g. https://example.com/photo.jpg'
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'Only http:// or https:// image URLs are allowed.'
  }
  return ''
}

/** Normalise a cover image URL for storage (empty string when absent). */
export function normalizeImageUrl(raw) {
  return validateImageUrl(raw) ? '' : String(raw || '').trim()
}
