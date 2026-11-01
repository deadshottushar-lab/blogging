import { colorFor, initials } from '../lib/utils.js'

/** Round avatar with a stable colour derived from the user id. */
export default function Avatar({ user, size = 40, className = '' }) {
  if (!user) {
    return (
      <span
        className={`avatar ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          background: '#94a3b8',
        }}
        aria-hidden="true"
      >
        ?
      </span>
    )
  }
  return (
    <span
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: colorFor(user.id),
      }}
      title={user.name}
      aria-hidden="true"
    >
      {initials(user.name)}
    </span>
  )
}
