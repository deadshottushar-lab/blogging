import { useEffect, useRef } from 'react'

/**
 * Accessible modal dialog used for confirmations.
 * Closes on Escape and on backdrop click.
 */
export default function Modal({ open, title, children, onClose, labelledBy }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog.
    const first = panelRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || 'modal-title'}
        ref={panelRef}
      >
        <h2 id={labelledBy || 'modal-title'} className="modal-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
